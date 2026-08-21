export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  template: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface Page {
  id: number;
  project_id: number;
  name: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: number;
  page_id: number;
  type: BlockType;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  responsive_styles: Record<string, Record<string, unknown>>;
  sort_order: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export type BlockType = 
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'link'
  | 'video'
  | 'container'
  | 'columns'
  | 'hero'
  | 'card'
  | 'gallery'
  | 'contact-form'
  | 'divider'
  | 'spacer';

export interface Media {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_at: string;
}

export interface NavigationItem {
  id: number;
  project_id: number;
  label: string;
  page_id: number | null;
  url: string | null;
  parent_id: number | null;
  sort_order: number;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignSettings {
  id: number;
  project_id: number;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  heading_font_family: string;
  border_radius: string;
  spacing_unit: string;
  custom_css: string | null;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  project_id: number;
  site_name: string;
  site_description: string | null;
  logo: string | null;
  favicon: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  social_links: Record<string, string>;
  footer_text: string | null;
  google_analytics: string | null;
  updated_at: string;
}

export interface SessionData {
  userId: number;
  email: string;
  currentProjectId: number | null;
}

export interface PreviewToken {
  token: string;
  projectId: number;
  expiresAt: number;
}
