import { z } from 'zod';

// Alleen http(s) toestaan zodat een 'javascript:' of 'data:' URL nooit als
// href/url(...) in de gepubliceerde preview terecht kan komen (click-XSS).
const httpUrl = () => z.string().url().refine(
  value => /^https?:\/\//i.test(value),
  { message: 'URL moet beginnen met http:// of https://' }
);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  template: z.enum(['blank', 'business', 'restaurant', 'portfolio', 'photographer', 'shop', 'gym', 'real-estate', 'freelancer', 'it-company', 'saas', 'blog', 'personal', 'local-business', 'landing']).optional()
});

export const updateProjectSchema = createProjectSchema.partial();

export const createPageSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
  status: z.enum(['draft', 'published']).default('draft')
});

export const updatePageSchema = createPageSchema.partial();

export const blockContentSchemas: Record<string, z.ZodSchema> = {
  heading: z.object({
    level: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h2'),
    text: z.string().max(200)
  }),
  text: z.object({
    content: z.string().max(10000)
  }),
  image: z.object({
    src: httpUrl().or(z.string().startsWith('/uploads/')),
    alt: z.string().max(200).optional(),
    caption: z.string().max(500).optional()
  }),
  button: z.object({
    text: z.string().max(50),
    url: httpUrl().or(z.string().startsWith('/')).or(z.string().startsWith('#')),
    variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
    size: z.enum(['sm', 'md', 'lg']).default('md')
  }),
  link: z.object({
    text: z.string().max(100),
    url: httpUrl().or(z.string().startsWith('/')).or(z.string().startsWith('#')),
    target: z.enum(['_self', '_blank']).default('_self')
  }),
  video: z.object({
    src: httpUrl(),
    poster: httpUrl().optional(),
    autoplay: z.boolean().default(false),
    controls: z.boolean().default(true),
    loop: z.boolean().default(false),
    muted: z.boolean().default(true)
  }),
  container: z.object({
    children: z.array(z.number()).default([])
  }),
  columns: z.object({
    columns: z.number().min(1).max(4).default(2),
    gap: z.string().default('1.5rem'),
    children: z.array(z.array(z.number())).default([[], []])
  }),
  hero: z.object({
    headline: z.string().max(200),
    subheadline: z.string().max(500).optional(),
    cta_text: z.string().max(50).optional(),
    cta_url: httpUrl().or(z.string().startsWith('/')).optional(),
    background_image: httpUrl().or(z.string().startsWith('/uploads/')).optional(),
    background_color: z.string().optional(),
    text_align: z.enum(['left', 'center', 'right']).default('center')
  }),
  card: z.object({
    image: httpUrl().or(z.string().startsWith('/uploads/')).optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    cta_text: z.string().max(50).optional(),
    cta_url: httpUrl().or(z.string().startsWith('/')).optional()
  }),
  gallery: z.object({
    images: z.array(z.object({
      src: httpUrl().or(z.string().startsWith('/uploads/')),
      alt: z.string().max(200).optional(),
      caption: z.string().max(500).optional()
    })).default([]),
    columns: z.number().min(1).max(4).default(3),
    gap: z.string().default('1rem')
  }),
  'contact-form': z.object({
    fields: z.array(z.object({
      type: z.enum(['text', 'email', 'textarea', 'select', 'checkbox']),
      name: z.string().max(50),
      label: z.string().max(100),
      required: z.boolean().default(false),
      placeholder: z.string().max(200).optional(),
      options: z.array(z.string()).optional()
    })).default([
      { type: 'text', name: 'name', label: 'Naam', required: true },
      { type: 'email', name: 'email', label: 'E-mail', required: true },
      { type: 'textarea', name: 'message', label: 'Bericht', required: true }
    ]),
    submit_text: z.string().max(50).default('Versturen'),
    success_message: z.string().max(200).default('Bedankt voor je bericht!'),
    recipient_email: z.string().email().optional()
  }),
  divider: z.object({
    variant: z.enum(['solid', 'dashed', 'dotted', 'double']).default('solid'),
    color: z.string().optional(),
    width: z.string().default('100%'),
    thickness: z.string().default('1px')
  }),
  spacer: z.object({
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).default('md'),
    custom_height: z.string().optional()
  }),
  header: z.object({
    logo: z.string().max(100).default('Jouw merk'),
    links: z.array(z.object({ label: z.string().max(50), url: z.string().max(200) })).max(8).default([]),
    cta_text: z.string().max(50).optional(),
    cta_url: z.string().max(200).optional()
  }),
  pricing: z.object({
    title: z.string().max(200).default('Kies je plan'),
    plans: z.array(z.object({ name: z.string().max(80), price: z.string().max(40), description: z.string().max(300).optional(), features: z.array(z.string().max(120)).max(12).default([]), cta_text: z.string().max(50).default('Start nu'), cta_url: z.string().max(200).default('#') })).min(1).max(4).default([])
  }),
  blog: z.object({
    title: z.string().max(200).default('Laatste artikelen'),
    posts: z.array(z.object({ title: z.string().max(160), excerpt: z.string().max(400), date: z.string().max(40).optional(), url: z.string().max(200).default('#') })).max(6).default([])
  }),
  faq: z.object({
    title: z.string().max(200).default('Veelgestelde vragen'),
    items: z.array(z.object({ question: z.string().max(200), answer: z.string().max(600) })).max(12).default([])
  }),
  testimonials: z.object({
    title: z.string().max(200).default('Wat klanten zeggen'),
    items: z.array(z.object({ quote: z.string().max(500), name: z.string().max(100), role: z.string().max(100).optional() })).max(6).default([])
  }),
  cta: z.object({
    title: z.string().max(200),
    text: z.string().max(500).optional(),
    button_text: z.string().max(50).default('Neem contact op'),
    button_url: z.string().max(200).default('#contact')
  }),
  footer: z.object({
    text: z.string().max(300).optional(),
    links: z.array(z.object({ label: z.string().max(50), url: z.string().max(200) })).max(10).default([])
  }),
  auth: z.object({
    mode: z.enum(['login', 'register']).default('login'),
    title: z.string().max(160).default('Welkom terug'),
    subtitle: z.string().max(300).optional(),
    button_text: z.string().max(50).default('Inloggen')
  }),
  dashboard: z.object({
    title: z.string().max(160).default('Dashboard'),
    stats: z.array(z.object({ label: z.string().max(80), value: z.string().max(40), change: z.string().max(40).optional() })).max(6).default([]),
    notice: z.string().max(300).optional()
  }),
  notfound: z.object({
    code: z.string().max(10).default('404'),
    title: z.string().max(160).default('Pagina niet gevonden'),
    text: z.string().max(300).optional(),
    button_text: z.string().max(50).default('Terug naar home'),
    button_url: z.string().max(200).default('/')
  })
};

export const blockStylesSchema = z.object({
  // Layout
  display: z.enum(['block', 'flex', 'grid', 'inline-block']).optional(),
  width: z.string().optional(),
  maxWidth: z.string().optional(),
  margin: z.string().optional(),
  padding: z.string().optional(),
  gap: z.string().optional(),
  
  // Typography
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  lineHeight: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  
  // Background
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundSize: z.string().optional(),
  backgroundPosition: z.string().optional(),
  backgroundRepeat: z.string().optional(),
  
  // Border
  borderRadius: z.string().optional(),
  borderWidth: z.string().optional(),
  borderColor: z.string().optional(),
  borderStyle: z.string().optional(),
  
  // Effects
  boxShadow: z.string().optional(),
  opacity: z.string().optional(),
  transform: z.string().optional(),
  transition: z.string().optional()
}).passthrough();

export const responsiveStylesSchema = z.object({
  desktop: blockStylesSchema.optional(),
  tablet: blockStylesSchema.optional(),
  mobile: blockStylesSchema.optional()
});

export const createBlockSchema = z.object({
  type: z.enum([
    'heading', 'text', 'image', 'button', 'link', 'video',
    'container', 'columns', 'hero', 'card', 'gallery',
    'contact-form', 'divider', 'spacer', 'header', 'pricing', 'blog', 'faq',
    'testimonials', 'cta', 'footer', 'auth', 'dashboard', 'notfound'
  ]),
  content: z.record(z.unknown()).default({}),
  styles: blockStylesSchema.default({}),
  responsive_styles: responsiveStylesSchema.default({}),
  parent_id: z.number().int().positive().optional()
});

export const updateBlockSchema = createBlockSchema.partial();

export const reorderIdsSchema = z.array(z.number().int().positive()).min(1).max(100)
  .refine(ids => new Set(ids).size === ids.length, 'IDs mogen niet dubbel voorkomen');

export const navigationItemSchema = z.object({
  label: z.string().min(1).max(50),
  page_id: z.number().int().positive().optional(),
  url: httpUrl().or(z.string().startsWith('/')).or(z.string().startsWith('#')).optional(),
  parent_id: z.number().int().positive().optional(),
  is_external: z.boolean().default(false)
});

export const designSettingsSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2563eb'),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0ea5e9'),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1f2937'),
  font_family: z.string().max(100).default('system-ui, -apple-system, sans-serif'),
  heading_font_family: z.string().max(100).default('system-ui, -apple-system, sans-serif'),
  border_radius: z.string().max(20).default('0.5rem'),
  spacing_unit: z.string().max(20).default('1rem'),
  custom_css: z.preprocess(value => value == null ? '' : value, z.string().max(10000).optional())
});

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1).max(100),
  site_description: z.string().max(500).optional(),
  logo: httpUrl().or(z.string().startsWith('/uploads/')).optional(),
  favicon: httpUrl().or(z.string().startsWith('/uploads/')).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(50).optional(),
  contact_address: z.string().max(500).optional(),
  social_links: z.record(httpUrl()).default({}),
  footer_text: z.string().max(500).optional(),
  google_analytics: z.string().max(100).optional()
});

export const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
