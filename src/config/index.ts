// Configuratie zonder secrets in environment variables
// Alle beveiligingsgevoelige data zit in de database

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  forceSecureCookie: process.env.FORCE_SECURE_COOKIE === 'true',
  
  // Database
  dbPath: process.env.DB_PATH || './data/cms.db',
  
  // Upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ],
  
  // Session
  sessionName: 'wb_session',
  sessionMaxAge: 1000 * 60 * 60 * 24 * 30, // 30 dagen
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 min
  rateLimitMax: 100,
  authRateLimitMax: 10,
  
  // Preview
  previewTokenExpiry: 1000 * 60 * 30, // 30 min
  
  // Export
  exportTempDir: '/tmp/wb-exports'
} as const;

export type Config = typeof config;
