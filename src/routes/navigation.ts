import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { navigationItemSchema } from '../utils/validation';
import { requireAuth, requireProjectAccess } from '../middleware/auth';

const router = Router();

// List navigation items for a project
router.get('/:projectId/navigation', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);

  const items = db.prepare('SELECT * FROM navigation_items WHERE project_id = ? ORDER BY sort_order ASC').all(projectId);
  res.json({ items });
});

// Create navigation item
router.post('/:projectId/navigation', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const parseResult = navigationItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const projectId = parseInt(req.params.projectId, 10);
  const { label, page_id, url, parent_id, is_external } = parseResult.data;
  const db = getDb();

  if (page_id) {
    const page = db.prepare('SELECT id FROM pages WHERE id = ? AND project_id = ?').get(page_id, projectId);
    if (!page) {
      return res.status(400).json({ error: 'Pagina niet gevonden binnen dit project' });
    }
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as maxOrder FROM navigation_items WHERE project_id = ?').get(projectId) as { maxOrder: number | null };
  const sortOrder = (maxOrder.maxOrder ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO navigation_items (project_id, label, page_id, url, parent_id, sort_order, is_external)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(projectId, label, page_id ?? null, url ?? null, parent_id ?? null, sortOrder, is_external ? 1 : 0);

  const item = db.prepare('SELECT * FROM navigation_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item });
});

// Update navigation item
router.patch('/:projectId/navigation/:itemId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM navigation_items WHERE id = ? AND project_id = ?').get(itemId, projectId);
  if (!existing) {
    return res.status(404).json({ error: 'Navigatie-item niet gevonden' });
  }

  const parseResult = navigationItemSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(parseResult.data)) {
    updates.push(`${key} = ?`);
    values.push(key === 'is_external' ? (value ? 1 : 0) : value);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(itemId);

  db.prepare(`UPDATE navigation_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const item = db.prepare('SELECT * FROM navigation_items WHERE id = ?').get(itemId);
  res.json({ item });
});

// Reorder navigation items
router.post('/:projectId/navigation/reorder', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { itemIds } = req.body as { itemIds: number[] };

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'itemIds array vereist' });
  }

  const db = getDb();
  const belongsToProject = db.prepare('SELECT COUNT(*) as count FROM navigation_items WHERE project_id = ? AND id IN (' + itemIds.map(() => '?').join(',') + ')')
    .get(projectId, ...itemIds) as { count: number };

  if (belongsToProject.count !== itemIds.length) {
    return res.status(400).json({ error: 'Ongeldige navigatielijst' });
  }

  const update = db.prepare('UPDATE navigation_items SET sort_order = ? WHERE id = ? AND project_id = ?');
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => update.run(index, id, projectId));
  });
  reorder(itemIds);

  res.json({ success: true });
});

// Delete navigation item
router.delete('/:projectId/navigation/:itemId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM navigation_items WHERE id = ? AND project_id = ?').get(itemId, projectId);
  if (!existing) {
    return res.status(404).json({ error: 'Navigatie-item niet gevonden' });
  }

  db.prepare('DELETE FROM navigation_items WHERE id = ?').run(itemId);
  res.json({ success: true });
});

export default router;
