import { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomBytes } from 'crypto';
import { extension as mimeExtension } from 'mime-types';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { getDb } from '../db';
import { config } from '../config';
import { requireAuth, requireProjectAccess } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = mimeExtension(file.mimetype) || 'bin';
      cb(null, `${randomBytes(16).toString('hex')}.${ext}`);
    }
  }),
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (!(config.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
      cb(new Error('Bestandstype niet toegestaan'));
      return;
    }
    cb(null, true);
  }
});

// List media for a project
router.get('/:projectId/media', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const db = getDb();
  const projectId = parseInt(req.params.projectId, 10);

  const media = db.prepare('SELECT * FROM media WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  res.json({ media });
});

// Upload media
router.post('/:projectId/media', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'Bestand is te groot'
        : (err.message || 'Upload mislukt');
      return res.status(400).json({ error: message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand ontvangen' });
    }

    const projectId = parseInt(req.params.projectId, 10);
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO media (project_id, filename, original_name, mime_type, size, alt_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(projectId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.body.alt_text || null);

    const item = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ media: item, url: `/uploads/${req.file.filename}` });
  });
});

// Update alt text
router.patch('/:projectId/media/:mediaId', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const mediaId = parseInt(req.params.mediaId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM media WHERE id = ? AND project_id = ?').get(mediaId, projectId);
  if (!existing) {
    return res.status(404).json({ error: 'Media niet gevonden' });
  }

  db.prepare('UPDATE media SET alt_text = ? WHERE id = ?').run(req.body.alt_text || null, mediaId);
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(mediaId);
  res.json({ media: item });
});

// Delete media
router.delete('/:projectId/media/:mediaId', requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const mediaId = parseInt(req.params.mediaId, 10);
  const db = getDb();

  const existing = db.prepare('SELECT * FROM media WHERE id = ? AND project_id = ?').get(mediaId, projectId) as { filename: string } | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Media niet gevonden' });
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(mediaId);

  try {
    await unlink(join(UPLOAD_DIR, existing.filename));
  } catch {
    // Bestand was al weg op disk; db-record is nu in ieder geval opgeruimd
  }

  res.json({ success: true });
});

export default router;
