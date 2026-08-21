import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { slugify, generateUniqueSlug } from '../utils/slug';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';
import { requireAuth, requireProjectAccess } from '../middleware/auth';
import { layouts } from '../utils/layouts';

const router = Router();

// List all projects for current user
router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM pages WHERE project_id = p.id) as page_count,
      (SELECT COUNT(*) FROM media WHERE project_id = p.id) as media_count
    FROM projects p
    WHERE p.user_id = ?
    ORDER BY p.updated_at DESC
  `).all(req.user!.userId);
  
  res.json({ projects });
});

// Get single project
router.get('/:projectId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project niet gevonden' });
  }
  
  res.json({ project });
});

// Create project
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parseResult = createProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }
  
  const { name, slug: providedSlug, description, template } = parseResult.data;
  const db = getDb();
  
  const baseSlug = providedSlug || slugify(name);
  const uniqueSlug = generateUniqueSlug(baseSlug, (s) => 
    db.prepare('SELECT 1 FROM projects WHERE slug = ? AND user_id = ?').get(s, req.user!.userId)
  );
  
  const existingSlug = db.prepare('SELECT 1 FROM projects WHERE slug = ?').get(uniqueSlug);
  if (existingSlug) {
    return res.status(400).json({ error: 'Deze slug is al in gebruik' });
  }
  
  const result = db.prepare(`
    INSERT INTO projects (user_id, name, slug, description, template)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user!.userId, name, uniqueSlug, description || null, template || 'blank');
  
  const projectId = result.lastInsertRowid as number;
  
  // Initialize design settings
  db.prepare('INSERT INTO design_settings (project_id) VALUES (?)').run(projectId);
  
  // Initialize site settings
  db.prepare('INSERT INTO site_settings (project_id, site_name) VALUES (?, ?)').run(projectId, name);
  
  // Create default pages based on template
  await createDefaultPages(db, projectId, template || 'blank');
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json({ project });
});

// Update project
router.patch('/:projectId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const parseResult = updateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }
  
  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(parseResult.data)) {
    if (key === 'slug') {
      const existing = db.prepare('SELECT 1 FROM projects WHERE slug = ? AND id != ?').get(value, projectId);
      if (existing) {
        return res.status(400).json({ error: 'Deze slug is al in gebruik' });
      }
    }
    updates.push(`${key} = ?`);
    values.push(value);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(projectId);
  
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.json({ project });
});

// Duplicate project
router.post('/:projectId/duplicate', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  
  const original = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!original) {
    return res.status(404).json({ error: 'Project niet gevonden' });
  }
  
  const newName = `${original.name} (kopie)`;
  const newSlug = generateUniqueSlug(slugify(newName), (s) => 
    db.prepare('SELECT 1 FROM projects WHERE slug = ? AND user_id = ?').get(s, req.user!.userId)
  );
  
  const result = db.prepare(`
    INSERT INTO projects (user_id, name, slug, description, template)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user!.userId, newName, newSlug, original.description, original.template);
  
  const newProjectId = result.lastInsertRowid as number;
  
  // Copy design settings
  const design = db.prepare('SELECT * FROM design_settings WHERE project_id = ?').get(projectId) as any;
  if (design) {
    const { id: _id, project_id: _projectId, updated_at: _updatedAt, ...designData } = design;
    db.prepare(`
      INSERT INTO design_settings (project_id, ${Object.keys(designData).join(', ')})
      VALUES (?, ${Object.keys(designData).map(() => '?').join(', ')})
    `).run(newProjectId, ...Object.values(designData));
  }
  
  // Copy site settings
  const site = db.prepare('SELECT * FROM site_settings WHERE project_id = ?').get(projectId) as any;
  if (site) {
    const { id: _id, project_id: _projectId, updated_at: _updatedAt, ...siteData } = site;
    db.prepare(`
      INSERT INTO site_settings (project_id, ${Object.keys(siteData).join(', ')})
      VALUES (?, ${Object.keys(siteData).map(() => '?').join(', ')})
    `).run(newProjectId, ...Object.values(siteData));
  }
  
  // Copy pages and blocks
  const pages = db.prepare('SELECT * FROM pages WHERE project_id = ?').all(projectId) as any[];
  const pageIds = new Map<number, number>();
  for (const page of pages) {
    const pageResult = db.prepare(`
      INSERT INTO pages (project_id, name, slug, title, seo_title, seo_description, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newProjectId, page.name, page.slug, page.title, page.seo_title, page.seo_description, page.status, page.sort_order);
    
    const newPageId = pageResult.lastInsertRowid as number;
    pageIds.set(page.id, newPageId);
    
    const blocks = db.prepare('SELECT * FROM blocks WHERE page_id = ?').all(page.id) as any[];
    const blockIds = new Map<number, number>();
    for (const block of blocks) {
      const blockResult = db.prepare(`
        INSERT INTO blocks (page_id, type, content, styles, responsive_styles, sort_order, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, NULL)
      `).run(newPageId, block.type, block.content, block.styles, block.responsive_styles, block.sort_order);
      blockIds.set(block.id, blockResult.lastInsertRowid as number);
    }
    for (const block of blocks) {
      if (block.parent_id && blockIds.has(block.parent_id)) {
        db.prepare('UPDATE blocks SET parent_id = ? WHERE id = ?')
          .run(blockIds.get(block.parent_id), blockIds.get(block.id));
      }
    }
  }
  
  // Copy media
  const media = db.prepare('SELECT * FROM media WHERE project_id = ?').all(projectId) as any[];
  for (const m of media) {
    db.prepare(`
      INSERT INTO media (project_id, filename, original_name, mime_type, size, width, height, alt_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newProjectId, m.filename, m.original_name, m.mime_type, m.size, m.width, m.height, m.alt_text);
  }
  
  // Copy navigation
  const nav = db.prepare('SELECT * FROM navigation_items WHERE project_id = ? ORDER BY sort_order').all(projectId) as any[];
  const navigationIds = new Map<number, number>();
  for (const item of nav) {
    const itemResult = db.prepare(`
      INSERT INTO navigation_items (project_id, label, page_id, url, parent_id, sort_order, is_external)
      VALUES (?, ?, ?, ?, NULL, ?, ?)
    `).run(newProjectId, item.label, pageIds.get(item.page_id) || null, item.url, item.sort_order, item.is_external);
    navigationIds.set(item.id, itemResult.lastInsertRowid as number);
  }
  for (const item of nav) {
    if (item.parent_id && navigationIds.has(item.parent_id)) {
      db.prepare('UPDATE navigation_items SET parent_id = ? WHERE id = ?')
        .run(navigationIds.get(item.parent_id), navigationIds.get(item.id));
    }
  }
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(newProjectId);
  res.status(201).json({ project });
});

// Delete project
router.delete('/:projectId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  
  res.json({ success: true });
});

async function createDefaultPages(db: any, projectId: number, template: string) {
  const templates: Record<string, Array<{name: string, slug: string, title: string}>> = {
    blank: [
      { name: 'Home', slug: 'home', title: 'Welkom' }
    ],
    business: [
      { name: 'Home', slug: 'home', title: 'Welkom bij ons bedrijf' },
      { name: 'Over ons', slug: 'over-ons', title: 'Over Ons' },
      { name: 'Diensten', slug: 'diensten', title: 'Onze Diensten' },
      { name: 'Contact', slug: 'contact', title: 'Contact' }
    ],
    portfolio: [
      { name: 'Home', slug: 'home', title: 'Mijn Portfolio' },
      { name: 'Projecten', slug: 'projecten', title: 'Projecten' },
      { name: 'Over mij', slug: 'over-mij', title: 'Over Mij' },
      { name: 'Contact', slug: 'contact', title: 'Contact' }
    ],
    restaurant: [
      { name: 'Home', slug: 'home', title: 'Welkom in ons restaurant' },
      { name: 'Menu', slug: 'menu', title: 'Ons Menu' },
      { name: 'Reserveren', slug: 'reserveren', title: 'Tafel Reserveren' },
      { name: 'Contact', slug: 'contact', title: 'Contact & Locatie' }
    ],
    landing: [
      { name: 'Home', slug: 'home', title: 'Landing Page' }
    ]
  };
  
  const pages = templates[template] || templates.blank;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    db.prepare(`
      INSERT INTO pages (project_id, name, slug, title, status, sort_order)
      VALUES (?, ?, ?, ?, 'published', ?)
    `).run(projectId, page.name, page.slug, page.title, i);
  }
  
  // Default navigation
  for (let i = 0; i < pages.length; i++) {
    db.prepare(`
      INSERT INTO navigation_items (project_id, label, page_id, sort_order)
      VALUES (?, ?, (SELECT id FROM pages WHERE project_id = ? AND slug = ?), ?)
    `).run(projectId, pages[i].name, projectId, pages[i].slug, i);
  }

  const layoutKey = template === 'portfolio' ? 'portfolio' : template === 'business' || template === 'restaurant' ? 'business' : 'landing';
  const firstPage = db.prepare('SELECT id FROM pages WHERE project_id = ? ORDER BY sort_order ASC LIMIT 1').get(projectId) as { id: number } | undefined;
  const layout = layouts[layoutKey];
  if (firstPage && layout) {
    const insert = db.prepare(`
      INSERT INTO blocks (page_id, type, content, styles, responsive_styles, sort_order, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `);
    layout.blocks.forEach((block, index) => insert.run(
      firstPage.id,
      block.type,
      JSON.stringify(block.content),
      JSON.stringify(block.styles || {}),
      JSON.stringify(block.responsive_styles || {}),
      index
    ));
  }
}

export default router;
