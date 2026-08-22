import { Router, Request, Response } from 'express';
import archiver from 'archiver';
import { existsSync } from 'fs';
import { join } from 'path';
import { getDb } from '../db';
import { requireAuth, requireProjectAccess } from '../middleware/auth';
import { renderPageHtml } from './preview';

const router = Router();
const uploadDir = join(process.cwd(), 'public', 'uploads');

router.get('/:projectId/export', requireAuth, requireProjectAccess, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  const design = db.prepare('SELECT * FROM design_settings WHERE project_id = ?').get(projectId) as any;
  const site = db.prepare('SELECT * FROM site_settings WHERE project_id = ?').get(projectId) as any;
  const pages = db.prepare("SELECT * FROM pages WHERE project_id = ? AND status = 'published' ORDER BY sort_order ASC").all(projectId) as any[];
  const navigation = db.prepare(`
    SELECT n.*, p.slug AS page_slug
    FROM navigation_items n
    LEFT JOIN pages p ON p.id = n.page_id AND p.status = 'published'
    WHERE n.project_id = ? ORDER BY n.sort_order ASC
  `).all(projectId);

  res.attachment(`${project.slug}-export.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', error => {
    if (!res.headersSent) res.status(500).json({ error: 'Exporteren mislukt' });
    else res.end();
    console.error('Export error:', error);
  });
  archive.pipe(res);

  for (const page of pages) {
    const blocks = (db.prepare('SELECT id, type, content, styles, sort_order, parent_id FROM blocks WHERE page_id = ?').all(page.id) as any[]).map(block => ({
      ...block,
      content: JSON.parse(block.content || '{}'),
      styles: JSON.parse(block.styles || '{}')
    }));
    const exportPrefix = page.slug === 'home' ? './' : '../';
    const html = renderPageHtml(page, project, design, site, blocks, navigation)
      .replace('href="/preview.css"', `href="${exportPrefix}preview.css"`)
      .replace('href="/template-themes.css"', `href="${exportPrefix}template-themes.css"`)
      .replace('href="/template-headers.css"', `href="${exportPrefix}template-headers.css"`)
      .replaceAll('/uploads/', 'uploads/')
      .replaceAll(`/preview/${encodeURIComponent(project.slug)}/home`, `${exportPrefix}index.html`)
      .replace(new RegExp(`/preview/${encodeURIComponent(project.slug)}/([^"']+)`, 'g'), (_match, slug) => `${exportPrefix}${slug}/index.html`)
      .replaceAll(`/preview/${encodeURIComponent(project.slug)}`, `${exportPrefix}index.html`);
    archive.append(html, { name: page.slug === 'home' ? 'index.html' : `${page.slug}/index.html` });
  }

  if (existsSync(uploadDir)) archive.directory(uploadDir, 'uploads');
  const previewCssPath = join(process.cwd(), 'public', 'preview.css');
  if (existsSync(previewCssPath)) archive.file(previewCssPath, { name: 'preview.css' });
  const templateThemesPath = join(process.cwd(), 'public', 'template-themes.css');
  if (existsSync(templateThemesPath)) archive.file(templateThemesPath, { name: 'template-themes.css' });
  const templateHeadersPath = join(process.cwd(), 'public', 'template-headers.css');
  if (existsSync(templateHeadersPath)) archive.file(templateHeadersPath, { name: 'template-headers.css' });
  archive.append(`# ${project.name}\n\nDeze export bevat de gepubliceerde pagina's van het project.`, { name: 'README.md' });
  archive.finalize();
});

export default router;