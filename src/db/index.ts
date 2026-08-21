import Database from 'better-sqlite3';
import { config } from '../config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

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
