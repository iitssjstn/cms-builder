import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { createBlockSchema, updateBlockSchema, blockContentSchemas, reorderIdsSchema } from '../utils/validation';
import { requireAuth, requirePageAccess } from '../middleware/auth';

const router = Router();

// List blocks for a page
router.get('/:pageId/blocks', requireAuth, requirePageAccess, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY sort_order ASC').all(req.page!.id) as any[];

  const blocks = rows.map(row => ({
    ...row,
    content: JSON.parse(row.content),
    styles: JSON.parse(row.styles),
    responsive_styles: JSON.parse(row.responsive_styles)
  }));

  res.json({ blocks });
});

// Create block
router.post('/:pageId/blocks', requireAuth, requirePageAccess, (req: Request, res: Response) => {
  const parseResult = createBlockSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const { type, content, styles, responsive_styles, parent_id } = parseResult.data;

  const contentSchema = blockContentSchemas[type];
  const contentCheck = contentSchema.safeParse(content);
  if (!contentCheck.success) {
    return res.status(400).json({ error: `Ongeldige content voor block type '${type}': ${contentCheck.error.errors[0].message}` });
  }

  const db = getDb();

  if (parent_id) {
    const parent = db.prepare('SELECT id FROM blocks WHERE id = ? AND page_id = ?').get(parent_id, req.page!.id);
    if (!parent) {
      return res.status(400).json({ error: 'Parent block niet gevonden op deze pagina' });
    }
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as maxOrder FROM blocks WHERE page_id = ? AND parent_id IS ?').get(req.page!.id, parent_id ?? null) as { maxOrder: number | null };
  const sortOrder = (maxOrder.maxOrder ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO blocks (page_id, type, content, styles, responsive_styles, sort_order, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.page!.id, type, JSON.stringify(contentCheck.data), JSON.stringify(styles), JSON.stringify(responsive_styles), sortOrder, parent_id ?? null);

  const row = db.prepare('SELECT * FROM blocks WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({
    block: { ...row, content: JSON.parse(row.content), styles: JSON.parse(row.styles), responsive_styles: JSON.parse(row.responsive_styles) }
  });
});

// Update block
router.patch('/:pageId/blocks/:blockId', requireAuth, requirePageAccess, (req: Request, res: Response) => {
  const blockId = parseInt(req.params.blockId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT * FROM blocks WHERE id = ? AND page_id = ?').get(blockId, req.page!.id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Block niet gevonden' });
  }

  const parseResult = updateBlockSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const data = parseResult.data;
  const type = data.type || existing.type;

  if (data.content !== undefined || data.type !== undefined) {
    const contentSchema = blockContentSchemas[type];
    const contentCheck = contentSchema.safeParse(data.content ?? JSON.parse(existing.content));
    if (!contentCheck.success) {
      return res.status(400).json({ error: `Ongeldige content voor block type '${type}': ${contentCheck.error.errors[0].message}` });
    }
    if (data.content !== undefined) {
      data.content = contentCheck.data;
    }
  }

  if (data.parent_id !== undefined) {
    if (data.parent_id === blockId) {
      return res.status(400).json({ error: 'Een block kan niet zijn eigen parent zijn' });
    }
    const parent = db.prepare('SELECT id FROM blocks WHERE id = ? AND page_id = ?').get(data.parent_id, req.page!.id);
    if (!parent) {
      return res.status(400).json({ error: 'Parent block niet gevonden op deze pagina' });
    }
    const cycle = db.prepare(`
      WITH RECURSIVE descendants(id) AS (
        SELECT id FROM blocks WHERE parent_id = ?
        UNION ALL
        SELECT b.id FROM blocks b JOIN descendants d ON b.parent_id = d.id
      )
      SELECT 1 FROM descendants WHERE id = ?
    `).get(blockId, data.parent_id);
    if (cycle) {
      return res.status(400).json({ error: 'Een block kan niet onder een descendant worden geplaatst' });
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    updates.push(`${key} = ?`);
    values.push(['content', 'styles', 'responsive_styles'].includes(key) ? JSON.stringify(value) : value);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(blockId);

  db.prepare(`UPDATE blocks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId) as any;
  res.json({
    block: { ...row, content: JSON.parse(row.content), styles: JSON.parse(row.styles), responsive_styles: JSON.parse(row.responsive_styles) }
  });
});

// Reorder blocks (binnen dezelfde parent)
router.post('/:pageId/blocks/reorder', requireAuth, requirePageAccess, (req: Request, res: Response) => {
  const parseResult = reorderIdsSchema.safeParse(req.body?.blockIds);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'blockIds array vereist' });
  }
  const blockIds = parseResult.data;

  const db = getDb();
  const belongsToPage = db.prepare('SELECT COUNT(*) as count FROM blocks WHERE page_id = ? AND id IN (' + blockIds.map(() => '?').join(',') + ')')
    .get(req.page!.id, ...blockIds) as { count: number };

  if (belongsToPage.count !== blockIds.length) {
    return res.status(400).json({ error: 'Ongeldige blocklijst' });
  }

  const update = db.prepare('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?');
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => update.run(index, id, req.page!.id));
  });
  reorder(blockIds);

  res.json({ success: true });
});

// Delete block
router.delete('/:pageId/blocks/:blockId', requireAuth, requirePageAccess, (req: Request, res: Response) => {
  const blockId = parseInt(req.params.blockId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM blocks WHERE id = ? AND page_id = ?').get(blockId, req.page!.id);
  if (!existing) {
    return res.status(404).json({ error: 'Block niet gevonden' });
  }

  db.prepare('DELETE FROM blocks WHERE id = ?').run(blockId);
  res.json({ success: true });
});

export default router;
