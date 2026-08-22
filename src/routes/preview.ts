import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { fullTemplates } from '../utils/fullTemplates';

const router = Router();

router.get('/template/:templateId', (req: Request, res: Response) => {
  const template = fullTemplates[req.params.templateId];
  if (!template) return res.status(404).send('Template niet gevonden');
  const page = template.pages[0];
  const project = { name: template.label, slug: template.id };
  const [primary, secondary, background, text, font, headingFont, radius] = template.colors;
  const design = { primary_color: primary, secondary_color: secondary, background_color: background, text_color: text, font_family: font, heading_font_family: headingFont, border_radius: radius };
  const site = { site_name: template.label, site_description: template.description, footer_text: `Voorbeeldtemplate: ${template.label}` };
  const navigation = template.pages.map(item => ({ label: item.name, page_slug: item.slug, url: null }));
  const blocks = page.blocks.map((block, index) => ({ id: index + 1, type: block.type, content: block.content, styles: block.styles || {}, sort_order: index, parent_id: null }));
  res.type('html').send(renderPageHtml({ ...page, status: 'published' }, project, design, site, blocks, navigation));
});

type PreviewBlock = {
  id: number;
  type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
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

function blockStyle(styles: Record<string, any> = {}): string {
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
    case 'header':
      return `<header class="preview-header"${attributes}><a class="preview-logo" href="/">${escapeHtml(content.logo)}</a><nav>${(content.links || []).map((link: any) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join('')}</nav>${content.cta_text ? `<a class="preview-button" href="${escapeHtml(content.cta_url || '#')}">${escapeHtml(content.cta_text)}</a>` : ''}</header>`;
    case 'pricing':
      return `<section class="preview-pricing"${attributes}><h2>${escapeHtml(content.title)}</h2><div class="preview-pricing-grid">${(content.plans || []).map((plan: any) => `<article class="preview-plan"><h3>${escapeHtml(plan.name)}</h3><strong>${escapeHtml(plan.price)}</strong>${plan.description ? `<p>${escapeHtml(plan.description)}</p>` : ''}<ul>${(plan.features || []).map((feature: string) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul><a class="preview-button" href="${escapeHtml(plan.cta_url || '#')}">${escapeHtml(plan.cta_text || 'Start nu')}</a></article>`).join('')}</div></section>`;
    case 'blog':
      return `<section class="preview-blog"${attributes}><h2>${escapeHtml(content.title)}</h2><div class="preview-blog-grid">${(content.posts || []).map((post: any) => `<article class="preview-post"><small>${escapeHtml(post.date)}</small><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt)}</p><a href="${escapeHtml(post.url || '#')}">Lees artikel</a></article>`).join('')}</div></section>`;
    case 'faq':
      return `<section class="preview-faq"${attributes}><h2>${escapeHtml(content.title)}</h2>${(content.items || []).map((item: any) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</section>`;
    case 'testimonials':
      return `<section class="preview-testimonials"${attributes}><h2>${escapeHtml(content.title)}</h2><div class="preview-testimonial-grid">${(content.items || []).map((item: any) => `<blockquote><p>“${escapeHtml(item.quote)}”</p><footer><strong>${escapeHtml(item.name)}</strong>${item.role ? ` · ${escapeHtml(item.role)}` : ''}</footer></blockquote>`).join('')}</div></section>`;
    case 'cta':
      return `<section class="preview-cta"${attributes}><h2>${escapeHtml(content.title)}</h2>${content.text ? `<p>${escapeHtml(content.text)}</p>` : ''}<a class="preview-button" href="${escapeHtml(content.button_url || '#')}">${escapeHtml(content.button_text || 'Neem contact op')}</a></section>`;
    case 'footer':
      return `<footer class="preview-component-footer"${attributes}><span>${escapeHtml(content.text)}</span><nav>${(content.links || []).map((link: any) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join('')}</nav></footer>`;
    case 'auth':
      return `<section class="preview-auth"${attributes}><div><h1>${escapeHtml(content.title)}</h1>${content.subtitle ? `<p>${escapeHtml(content.subtitle)}</p>` : ''}<form class="preview-form"><label>E-mail<input type="email" required></label><label>Wachtwoord<input type="password" required></label>${content.mode === 'register' ? '<label>Bevestig wachtwoord<input type="password" required></label>' : ''}<button class="preview-button" type="submit">${escapeHtml(content.button_text || 'Inloggen')}</button></form></div></section>`;
    case 'dashboard':
      return `<section class="preview-dashboard"${attributes}><h1>${escapeHtml(content.title)}</h1>${content.notice ? `<p class="preview-notice">${escapeHtml(content.notice)}</p>` : ''}<div class="preview-stat-grid">${(content.stats || []).map((stat: any) => `<article><small>${escapeHtml(stat.label)}</small><strong>${escapeHtml(stat.value)}</strong>${stat.change ? `<span>${escapeHtml(stat.change)}</span>` : ''}</article>`).join('')}</div></section>`;
    case 'notfound':
      return `<section class="preview-notfound"${attributes}><strong>${escapeHtml(content.code || '404')}</strong><h1>${escapeHtml(content.title || 'Pagina niet gevonden')}</h1>${content.text ? `<p>${escapeHtml(content.text)}</p>` : ''}<a class="preview-button" href="${escapeHtml(content.button_url || '/')}">${escapeHtml(content.button_text || 'Terug naar home')}</a></section>`;
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
<link rel="stylesheet" href="/preview.css">
<title>${escapeHtml(page.seo_title || page.title || site?.site_name || project.name)}</title>
<meta name="description" content="${escapeHtml(page.seo_description || site?.site_description || '')}">
<style>
:root{--primary:${escapeHtml(design?.primary_color || '#2563eb')};--secondary:${escapeHtml(design?.secondary_color || '#0ea5e9')};--background:${escapeHtml(design?.background_color || '#ffffff')};--text:${escapeHtml(design?.text_color || '#1f2937')};--radius:${escapeHtml(design?.border_radius || '0.5rem')};--font-family:${fontFamily};--heading-font:${headingFont};}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font-family:${fontFamily};line-height:1.6}h1,h2,h3,h4,h5,h6{font-family:${headingFont};line-height:1.2}a{color:var(--primary)}.preview-nav{display:flex;gap:1rem;flex-wrap:wrap;padding:1rem 5%;border-bottom:1px solid #e5e7eb}.preview-page{max-width:1100px;margin:0 auto;padding:2rem 5%}.preview-button{display:inline-block;background:var(--primary);color:#fff;padding:.65rem 1rem;border-radius:var(--radius);text-decoration:none}.preview-hero{padding:4rem 2rem;text-align:center;background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;border-radius:var(--radius)}.preview-card{padding:1.25rem;border:1px solid #e5e7eb;border-radius:var(--radius)}.preview-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.preview-gallery figure{margin:0}.preview-form{display:grid;gap:1rem;max-width:600px}.preview-form label{display:grid;gap:.35rem}.preview-form input,.preview-form textarea{padding:.65rem;border:1px solid #d1d5db;border-radius:var(--radius);font:inherit}.preview-form textarea{min-height:120px}.preview-spacer-xs{height:1rem}.preview-spacer-sm{height:2rem}.preview-spacer-md{height:4rem}.preview-spacer-lg{height:6rem}.preview-spacer-xl{height:10rem}img,video{max-width:100%;height:auto}.preview-footer{padding:2rem 5%;border-top:1px solid #e5e7eb;color:#6b7280}
${customCss}
.preview-page > *{margin-bottom:2rem}.preview-page > .preview-card{display:inline-block;vertical-align:top;width:calc(33.333% - 1.1rem);margin-right:1rem;min-height:150px}.preview-page > .preview-card:nth-of-type(3n){margin-right:0}.preview-hero{background-size:cover;background-position:center;box-shadow:0 1rem 2rem rgba(15,23,42,.12)}.preview-hero h1{max-width:760px;margin:0 auto 1rem;font-size:clamp(2.25rem,5vw,4.5rem)}.preview-hero p{max-width:680px;margin:0 auto 1.5rem;font-size:1.15rem}.preview-card img{width:100%;border-radius:calc(var(--radius) - .1rem);margin-bottom:1rem}.preview-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.preview-gallery figcaption{font-size:.85rem;color:#64748b}.preview-form button{border:0;cursor:pointer;font:inherit}.preview-nav a{text-decoration:none;font-weight:600}.preview-nav a:hover{text-decoration:underline}@media(max-width:700px){.preview-page > .preview-card{display:block;width:100%;margin-right:0}.preview-page{padding:1.25rem 5%}.preview-hero{padding:3rem 1.25rem}.preview-nav{padding:.85rem 5%}}
.preview-header{display:flex;align-items:center;gap:2rem;padding:1.25rem 5%;border-bottom:1px solid #e5e7eb;background:rgba(255,255,255,.9);position:relative}.preview-header nav,.preview-component-footer nav{display:flex;gap:1rem;flex:1;justify-content:center;flex-wrap:wrap}.preview-header a,.preview-component-footer a{color:inherit;text-decoration:none}.preview-logo{font-weight:800;font-size:1.2rem}.preview-pricing h2,.preview-blog h2,.preview-faq h2,.preview-testimonials h2{text-align:center}.preview-pricing-grid,.preview-blog-grid,.preview-testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.preview-plan,.preview-post,.preview-testimonial-grid blockquote{padding:1.5rem;background:#fff;border:1px solid #e5e7eb;border-radius:var(--radius);box-shadow:0 .5rem 1.5rem rgba(15,23,42,.06)}.preview-plan strong{display:block;font-size:2.25rem;margin:.75rem 0;color:var(--primary)}.preview-plan ul{padding-left:1.25rem;min-height:7rem}.preview-plan li{margin:.4rem 0}.preview-post small{color:#64748b}.preview-post h3{margin:.5rem 0}.preview-post a{font-weight:700}.preview-faq{max-width:760px;margin-left:auto;margin-right:auto}.preview-faq details{border-bottom:1px solid #dbe2ea;padding:1rem 0}.preview-faq summary{cursor:pointer;font-weight:700}.preview-faq p{margin:.75rem 0 0;color:#475569}.preview-testimonial-grid blockquote{margin:0}.preview-testimonial-grid blockquote p{font-size:1.1rem}.preview-testimonial-grid footer{color:#64748b}.preview-cta{padding:3rem 2rem;text-align:center;background:var(--primary);color:#fff;border-radius:var(--radius)}.preview-cta .preview-button{background:#fff;color:var(--primary)}.preview-component-footer{display:flex;align-items:center;gap:1rem;padding:2rem 5%;border-top:1px solid #e5e7eb}.preview-auth{display:grid;place-items:center;min-height:420px}.preview-auth>div{width:min(100%,420px);padding:2rem;background:#fff;border:1px solid #e5e7eb;border-radius:var(--radius);box-shadow:0 1rem 2rem rgba(15,23,42,.08)}.preview-auth h1{text-align:center}.preview-dashboard{padding:2rem;background:#f8fafc;border-radius:var(--radius)}.preview-dashboard h1{margin-top:0}.preview-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.preview-stat-grid article{padding:1rem;background:#fff;border:1px solid #e5e7eb;border-radius:var(--radius)}.preview-stat-grid small,.preview-stat-grid strong,.preview-stat-grid span{display:block}.preview-stat-grid strong{font-size:1.8rem;margin:.35rem 0}.preview-stat-grid span{color:#15803d;font-size:.85rem}.preview-notice{padding:1rem;background:#ecfeff;border-left:4px solid var(--secondary)}.preview-notfound{text-align:center;padding:6rem 1rem}.preview-notfound>strong{display:block;font-size:clamp(4rem,12vw,9rem);line-height:1;color:var(--primary)}.preview-notfound h1{font-size:2rem}
.preview-button:hover{filter:brightness(.92);transform:translateY(-1px)}.preview-button:focus-visible,.preview-nav a:focus-visible,.preview-header a:focus-visible,.preview-component-footer a:focus-visible,summary:focus-visible{outline:3px solid var(--secondary);outline-offset:3px}.preview-plan:hover,.preview-post:hover,.preview-testimonial-grid blockquote:hover{border-color:var(--primary);transform:translateY(-2px);transition:transform .18s ease,border-color .18s ease}
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
