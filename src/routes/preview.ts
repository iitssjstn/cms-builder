import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

type PreviewBlock = {
  id: number;
  type: string;
  content: Record<string, any>;
  styles: Record<string, string>;
  sort_order: number;
  parent_id: number | null;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function blockStyle(styles: Record<string, string> = {}): string {
  const allowed = ['display', 'width', 'maxWidth', 'margin', 'padding', 'gap', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign', 'color', 'fontFamily', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'borderRadius', 'borderWidth', 'borderColor', 'borderStyle', 'boxShadow', 'opacity', 'transform', 'transition'];
  return allowed
    .filter(key => styles[key])
    .map(key => `${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${escapeHtml(styles[key])}`)
    .join(';');
}

function renderBlock(block: PreviewBlock, children: string): string {
  const content = block.content || {};
  const style = blockStyle(block.styles);
  const attributes = style ? ` style="${style}"` : '';
  const text = escapeHtml(content.text || content.content || '');

  switch (block.type) {
    case 'heading':
      return `<${escapeHtml(content.level || 'h2')}${attributes}>${escapeHtml(content.text)}</${escapeHtml(content.level || 'h2')}>`;
    case 'text':
      return `<div${attributes}>${text.replace(/\n/g, '<br>')}</div>`;
    case 'image':
      return `<figure${attributes}><img src="${escapeHtml(content.src)}" alt="${escapeHtml(content.alt)}">${content.caption ? `<figcaption>${escapeHtml(content.caption)}</figcaption>` : ''}</figure>`;
    case 'button':
    case 'link':
      return `<a class="preview-button" href="${escapeHtml(content.url || '#')}"${attributes}>${escapeHtml(content.text)}</a>`;
    case 'video':
      return `<video src="${escapeHtml(content.src)}"${content.poster ? ` poster="${escapeHtml(content.poster)}"` : ''} ${content.controls !== false ? 'controls' : ''}${content.muted ? ' muted' : ''}${content.loop ? ' loop' : ''}${attributes}></video>`;
    case 'hero':
      return `<section class="preview-hero"${content.background_image ? ` style="background-image:linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,.2)),url('${escapeHtml(content.background_image)}');${style}"` : attributes}><h1>${escapeHtml(content.headline)}</h1>${content.subheadline ? `<p>${escapeHtml(content.subheadline)}</p>` : ''}${content.cta_url ? `<a class="preview-button" href="${escapeHtml(content.cta_url)}">${escapeHtml(content.cta_text || 'Meer informatie')}</a>` : ''}${children}</section>`;
    case 'card':
      return `<article class="preview-card"${attributes}>${content.image ? `<img src="${escapeHtml(content.image)}" alt="">` : ''}${content.title ? `<h3>${escapeHtml(content.title)}</h3>` : ''}${content.description ? `<p>${escapeHtml(content.description)}</p>` : ''}${content.cta_url ? `<a class="preview-button" href="${escapeHtml(content.cta_url)}">${escapeHtml(content.cta_text || 'Lees meer')}</a>` : ''}${children}</article>`;
    case 'gallery':
      return `<div class="preview-gallery"${attributes}>${(content.images || []).map((image: any) => `<figure><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`;
    case 'contact-form':
      return `<form class="preview-form"${attributes}>${(content.fields || []).map((field: any) => `<label>${escapeHtml(field.label)}${field.type === 'textarea' ? `<textarea name="${escapeHtml(field.name)}" placeholder="${escapeHtml(field.placeholder)}"${field.required ? ' required' : ''}></textarea>` : `<input type="${escapeHtml(field.type === 'select' ? 'text' : field.type)}" name="${escapeHtml(field.name)}" placeholder="${escapeHtml(field.placeholder)}"${field.required ? ' required' : ''}>`}</label>`).join('')}<button class="preview-button" type="submit">${escapeHtml(content.submit_text || 'Versturen')}</button></form>`;
    case 'divider':
      return `<hr style="border-style:${escapeHtml(content.variant || 'solid')};${style}"${attributes ? '' : ''}>`;
    case 'spacer':
      return `<div class="preview-spacer preview-spacer-${escapeHtml(content.size || 'md')}" aria-hidden="true"${attributes}></div>`;
    case 'container':
    case 'columns':
      return `<div${attributes}>${children}</div>`;
    default:
      return `<div${attributes}>${children || text}</div>`;
  }
}

export function renderPageHtml(page: any, project: any, design: any, site: any, blocks: PreviewBlock[], navigation: any[]): string {
  const childrenByParent = new Map<number | null, PreviewBlock[]>();
  for (const block of blocks) {
    const list = childrenByParent.get(block.parent_id) || [];
    list.push(block);
    childrenByParent.set(block.parent_id, list);
  }

  const renderBlocks = (parentId: number | null): string => (childrenByParent.get(parentId) || [])
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(block => renderBlock(block, renderBlocks(block.id)))
    .join('\n');

  const navHtml = navigation.map(item => {
    const href = item.page_slug ? `/preview/${encodeURIComponent(project.slug)}/${encodeURIComponent(item.page_slug)}` : item.url || '#';
    return `<a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a>`;
  }).join('');

  const fontFamily = escapeHtml(design?.font_family || 'system-ui, sans-serif');
  const headingFont = escapeHtml(design?.heading_font_family || fontFamily);
  const customCss = site ? String(design?.custom_css || '') : '';

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.seo_title || page.title || site?.site_name || project.name)}</title>
<meta name="description" content="${escapeHtml(page.seo_description || site?.site_description || '')}">
<style>
:root{--primary:${escapeHtml(design?.primary_color || '#2563eb')};--secondary:${escapeHtml(design?.secondary_color || '#0ea5e9')};--background:${escapeHtml(design?.background_color || '#ffffff')};--text:${escapeHtml(design?.text_color || '#1f2937')};--radius:${escapeHtml(design?.border_radius || '0.5rem')};}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font-family:${fontFamily};line-height:1.6}h1,h2,h3,h4,h5,h6{font-family:${headingFont};line-height:1.2}a{color:var(--primary)}.preview-nav{display:flex;gap:1rem;flex-wrap:wrap;padding:1rem 5%;border-bottom:1px solid #e5e7eb}.preview-page{max-width:1100px;margin:0 auto;padding:2rem 5%}.preview-button{display:inline-block;background:var(--primary);color:#fff;padding:.65rem 1rem;border-radius:var(--radius);text-decoration:none}.preview-hero{padding:4rem 2rem;text-align:center;background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;border-radius:var(--radius)}.preview-card{padding:1.25rem;border:1px solid #e5e7eb;border-radius:var(--radius)}.preview-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.preview-gallery figure{margin:0}.preview-form{display:grid;gap:1rem;max-width:600px}.preview-form label{display:grid;gap:.35rem}.preview-form input,.preview-form textarea{padding:.65rem;border:1px solid #d1d5db;border-radius:var(--radius);font:inherit}.preview-form textarea{min-height:120px}.preview-spacer-xs{height:1rem}.preview-spacer-sm{height:2rem}.preview-spacer-md{height:4rem}.preview-spacer-lg{height:6rem}.preview-spacer-xl{height:10rem}img,video{max-width:100%;height:auto}.preview-footer{padding:2rem 5%;border-top:1px solid #e5e7eb;color:#6b7280}
${customCss}
.preview-page > *{margin-bottom:2rem}.preview-page > .preview-card{display:inline-block;vertical-align:top;width:calc(33.333% - 1.1rem);margin-right:1rem;min-height:150px}.preview-page > .preview-card:nth-of-type(3n){margin-right:0}.preview-hero{background-size:cover;background-position:center;box-shadow:0 1rem 2rem rgba(15,23,42,.12)}.preview-hero h1{max-width:760px;margin:0 auto 1rem;font-size:clamp(2.25rem,5vw,4.5rem)}.preview-hero p{max-width:680px;margin:0 auto 1.5rem;font-size:1.15rem}.preview-card img{width:100%;border-radius:calc(var(--radius) - .1rem);margin-bottom:1rem}.preview-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.preview-gallery figcaption{font-size:.85rem;color:#64748b}.preview-form button{border:0;cursor:pointer;font:inherit}.preview-nav a{text-decoration:none;font-weight:600}.preview-nav a:hover{text-decoration:underline}@media(max-width:700px){.preview-page > .preview-card{display:block;width:100%;margin-right:0}.preview-page{padding:1.25rem 5%}.preview-hero{padding:3rem 1.25rem}.preview-nav{padding:.85rem 5%}}
</style>
</head>
<body>
<nav class="preview-nav">${navHtml}</nav>
<main class="preview-page">${renderBlocks(null)}</main>
<footer class="preview-footer">${escapeHtml(site?.footer_text || site?.site_name || project.name)}</footer>
</body>
</html>`;
}

router.get('/:projectSlug/:pageSlug?', (req: Request, res: Response) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE slug = ?').get(req.params.projectSlug) as any;
  if (!project) return res.status(404).send('Project niet gevonden');

  const isOwner = Boolean(req.session?.userId && req.session.userId === project.user_id);
  const pageSlug = req.params.pageSlug;
  const page = db.prepare(`
    SELECT * FROM pages
    WHERE project_id = ? AND (? IS NULL OR slug = ?) AND (? = 1 OR status = 'published')
    ORDER BY sort_order ASC LIMIT 1
  `).get(project.id, pageSlug || null, pageSlug || null, isOwner ? 1 : 0) as any;
  if (!page) return res.status(404).send('Pagina niet gevonden');

  const blocks = (db.prepare('SELECT id, type, content, styles, sort_order, parent_id FROM blocks WHERE page_id = ?').all(page.id) as any[]).map(block => ({
    ...block,
    content: JSON.parse(block.content || '{}'),
    styles: JSON.parse(block.styles || '{}')
  }));
  const design = db.prepare('SELECT * FROM design_settings WHERE project_id = ?').get(project.id) as any;
  const site = db.prepare('SELECT * FROM site_settings WHERE project_id = ?').get(project.id) as any;
  const navigation = db.prepare(`
    SELECT n.*, p.slug AS page_slug
    FROM navigation_items n
    LEFT JOIN pages p ON p.id = n.page_id AND p.status = 'published'
    WHERE n.project_id = ? ORDER BY n.sort_order ASC
  `).all(project.id);

  res.type('html').send(renderPageHtml(page, project, design, site, blocks, navigation));
});

export default router;
