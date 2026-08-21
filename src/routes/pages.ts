import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { createPageSchema, updatePageSchema } from '../utils/validation';
import { requireAuth, requireProjectAccess, requirePageAccess } from '../middleware/auth';

const router = Router();

// List all pages for a project
router.get('/:projectId/pages', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);

  const pages = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM blocks WHERE page_id = p.id) as block_count
    FROM pages p
    WHERE p.project_id = ?
    ORDER BY p.sort_order ASC
  `).all(projectId);

  res.json({ pages });
});

// Get single page
router.get('/:projectId/pages/:pageId', requireAuth, requireProjectAccess, requirePageAccess, (req: Request, res: Response) => {
  const db = getDb();
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.page!.id);
  res.json({ page });
});

// Create page
router.post('/:projectId/pages', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const parseResult = createPageSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const projectId = parseInt(req.params.projectId, 10);
  const { name, slug, title, seo_title, seo_description, status } = parseResult.data;
  const db = getDb();

  const existing = db.prepare('SELECT 1 FROM pages WHERE project_id = ? AND slug = ?').get(projectId, slug);
  if (existing) {
    return res.status(400).json({ error: 'Deze slug is al in gebruik binnen dit project' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as maxOrder FROM pages WHERE project_id = ?').get(projectId) as { maxOrder: number | null };
  const sortOrder = (maxOrder.maxOrder ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO pages (project_id, name, slug, title, seo_title, seo_description, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(projectId, name, slug, title, seo_title || null, seo_description || null, status, sortOrder);

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ page });
});

// Update page
router.patch('/:projectId/pages/:pageId', requireAuth, requireProjectAccess, requirePageAccess, (req: Request, res: Response) => {
  const parseResult = updatePageSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const pageId = req.page!.id;
  const projectId = req.page!.project_id;
  const db = getDb();

  if (parseResult.data.slug) {
    const existing = db.prepare('SELECT 1 FROM pages WHERE project_id = ? AND slug = ? AND id != ?').get(projectId, parseResult.data.slug, pageId);
    if (existing) {
      return res.status(400).json({ error: 'Deze slug is al in gebruik binnen dit project' });
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(parseResult.data)) {
    updates.push(`${key} = ?`);
    values.push(value);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(pageId);

  db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(pageId);
  res.json({ page });
});

// Reorder pages
router.post('/:projectId/pages/reorder', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { pageIds } = req.body as { pageIds: number[] };

  if (!Array.isArray(pageIds)) {
    return res.status(400).json({ error: 'pageIds array vereist' });
  }

  const db = getDb();
  const belongsToProject = db.prepare('SELECT COUNT(*) as count FROM pages WHERE project_id = ? AND id IN (' + pageIds.map(() => '?').join(',') + ')')
    .get(projectId, ...pageIds) as { count: number };

  if (pageIds.length === 0 || belongsToProject.count !== pageIds.length) {
    return res.status(400).json({ error: 'Ongeldige paginalijst' });
  }

  const update = db.prepare('UPDATE pages SET sort_order = ? WHERE id = ? AND project_id = ?');
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => update.run(index, id, projectId));
  });
  reorder(pageIds);

  res.json({ success: true });
});

// Delete page
router.delete('/:projectId/pages/:pageId', requireAuth, requireProjectAccess, requirePageAccess, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM pages WHERE id = ?').run(req.page!.id);
  res.json({ success: true });
});

export default router;
