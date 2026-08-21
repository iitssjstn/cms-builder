import { Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export function runMigrations(db: Database) {
  // Schema aanmaken
  const schemaPath = join(process.cwd(), 'src/db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  // Migratie versie tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  const currentVersion = 1;
  const applied = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(currentVersion);
  
  if (!applied) {
    // Toekomstige migraties hier toevoegen
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(currentVersion);
  }
}
