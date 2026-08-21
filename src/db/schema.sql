-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  template TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Pages
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);

-- Blocks (page builder elements)
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}',
  styles TEXT NOT NULL DEFAULT '{}',
  responsive_styles TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blocks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);

-- Navigation
CREATE TABLE IF NOT EXISTS navigation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  page_id INTEGER,
  url TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_navigation_project_id ON navigation_items(project_id);
CREATE INDEX IF NOT EXISTS idx_navigation_parent_id ON navigation_items(parent_id);

-- Design Settings
CREATE TABLE IF NOT EXISTS design_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER UNIQUE NOT NULL,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#0ea5e9',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  font_family TEXT DEFAULT 'system-ui, -apple-system, sans-serif',
  heading_font_family TEXT DEFAULT 'system-ui, -apple-system, sans-serif',
  border_radius TEXT DEFAULT '0.5rem',
  spacing_unit TEXT DEFAULT '1rem',
  custom_css TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER UNIQUE NOT NULL,
  site_name TEXT NOT NULL DEFAULT 'Mijn Website',
  site_description TEXT,
  logo TEXT,
  favicon TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  social_links TEXT NOT NULL DEFAULT '{}',
  footer_text TEXT,
  google_analytics TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Setup status
CREATE TABLE IF NOT EXISTS setup_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME
);

INSERT OR IGNORE INTO setup_status (id, completed) VALUES (1, 0);

-- App secrets (bv. session secret) - zodat er geen secrets in env vars nodig zijn
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Sessions (voor express-session met SQLite)
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expired DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
