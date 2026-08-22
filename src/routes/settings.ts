import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { designSettingsSchema, siteSettingsSchema } from '../utils/validation';
import { requireAuth, requireProjectAccess } from '../middleware/auth';

const router = Router();

// Get design settings
router.get('/:projectId/design', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);

  const design = db.prepare('SELECT * FROM design_settings WHERE project_id = ?').get(projectId);
  res.json({ design });
});

// Update design settings
router.patch('/:projectId/design', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const parseResult = designSettingsSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(parseResult.data)) {
    updates.push(`${key} = ?`);
    values.push(value);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }

  const existing = db.prepare('SELECT 1 FROM design_settings WHERE project_id = ?').get(projectId);

  if (!existing) {
    db.prepare(`INSERT INTO design_settings (project_id, ${Object.keys(parseResult.data).join(', ')}) VALUES (?, ${Object.keys(parseResult.data).map(() => '?').join(', ')})`)
      .run(projectId, ...Object.values(parseResult.data));
  } else {
    db.prepare(`UPDATE design_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?`).run(...values, projectId);
  }

  const design = db.prepare('SELECT * FROM design_settings WHERE project_id = ?').get(projectId);
  res.json({ design });
});

// Get site settings
router.get('/:projectId/settings', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);

  const row = db.prepare('SELECT * FROM site_settings WHERE project_id = ?').get(projectId) as any;
  if (row) {
    row.social_links = JSON.parse(row.social_links || '{}');
  }
  res.json({ settings: row });
});

// Update site settings
router.patch('/:projectId/settings', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const parseResult = siteSettingsSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(parseResult.data)) {
    updates.push(`${key} = ?`);
    values.push(key === 'social_links' ? JSON.stringify(value) : value);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Geen velden om bij te werken' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(projectId);

  db.prepare(`UPDATE site_settings SET ${updates.join(', ')} WHERE project_id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM site_settings WHERE project_id = ?').get(projectId) as any;
  row.social_links = JSON.parse(row.social_links || '{}');
  res.json({ settings: row });
});

export default router;
