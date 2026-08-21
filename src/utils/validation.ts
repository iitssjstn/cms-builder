import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  template: z.enum(['blank', 'business', 'portfolio', 'restaurant', 'landing']).optional()
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
    src: z.string().url().or(z.string().startsWith('/uploads/')),
    alt: z.string().max(200).optional(),
    caption: z.string().max(500).optional()
  }),
  button: z.object({
    text: z.string().max(50),
    url: z.string().url().or(z.string().startsWith('/')).or(z.string().startsWith('#')),
    variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
    size: z.enum(['sm', 'md', 'lg']).default('md')
  }),
  link: z.object({
    text: z.string().max(100),
    url: z.string().url().or(z.string().startsWith('/')).or(z.string().startsWith('#')),
    target: z.enum(['_self', '_blank']).default('_self')
  }),
  video: z.object({
    src: z.string().url(),
    poster: z.string().url().optional(),
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
    cta_url: z.string().url().or(z.string().startsWith('/')).optional(),
    background_image: z.string().url().or(z.string().startsWith('/uploads/')).optional(),
    background_color: z.string().optional(),
    text_align: z.enum(['left', 'center', 'right']).default('center')
  }),
  card: z.object({
    image: z.string().url().or(z.string().startsWith('/uploads/')).optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    cta_text: z.string().max(50).optional(),
    cta_url: z.string().url().or(z.string().startsWith('/')).optional()
  }),
  gallery: z.object({
    images: z.array(z.object({
      src: z.string().url().or(z.string().startsWith('/uploads/')),
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
    'contact-form', 'divider', 'spacer'
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
  url: z.string().url().or(z.string().startsWith('/')).or(z.string().startsWith('#')).optional(),
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
  custom_css: z.string().max(10000).optional()
});

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1).max(100),
  site_description: z.string().max(500).optional(),
  logo: z.string().url().or(z.string().startsWith('/uploads/')).optional(),
  favicon: z.string().url().or(z.string().startsWith('/uploads/')).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(50).optional(),
  contact_address: z.string().max(500).optional(),
  social_links: z.record(z.string().url()).default({}),
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
