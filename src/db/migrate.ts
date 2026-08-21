import Database from 'better-sqlite3';
import { config } from '../config';
import { runMigrations } from './migrations';

const database = new Database(config.dbPath);

try {
  runMigrations(database);
} finally {
  database.close();
}