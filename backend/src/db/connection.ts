import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../config/logger';

let db: Database.Database | null = null;

function getDbPath(): string {
  // Tests and one-off scripts may point at a different DB via DB_PATH.
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  // DB lives at project root (two levels up from backend/src/)
  return path.resolve(__dirname, '../../../progress.sqlite');
}

/** Test-only seam: swap the singleton DB for an arbitrary connection. */
export function setDbForTesting(injected: Database.Database | null): void {
  db = injected;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call openDb() first.');
  return db;
}

export function openDb(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  logger.info({ dbPath }, 'Opening SQLite database');

  try {
    db = new Database(dbPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const brokenPath = dbPath.replace('.sqlite', `.broken.${Date.now()}.sqlite`);
    logger.error({ err: msg }, 'Failed to open database — renaming to .broken and retrying');
    try {
      fs.renameSync(dbPath, brokenPath);
    } catch {
      // ignore rename failure
    }
    db = new Database(dbPath);
  }

  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
