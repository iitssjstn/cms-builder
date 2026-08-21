import Database from 'better-sqlite3';
import { config } from '../config';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';

const dbDir = join(process.cwd(), 'data');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.dbPath);

// SQLite optimalisaties
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Migraties uitvoeren
import { runMigrations } from './migrations';
runMigrations(db);

export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}

/**
 * Haalt een secret op uit de database, of genereert en bewaart er een als
 * die nog niet bestaat. Zo hoeven er geen secrets in environment variables
 * te staan (zie src/config).
 */
export function getOrCreateSecret(key: string): string {
  const row = db.prepare('SELECT value FROM app_secrets WHERE key = ?').get(key) as { value: string } | undefined;
  if (row) {
    return row.value;
  }

  const value = randomBytes(48).toString('hex');
  db.prepare('INSERT INTO app_secrets (key, value) VALUES (?, ?)').run(key, value);
  return value;
}
