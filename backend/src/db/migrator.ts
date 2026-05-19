import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function getApplied(db: Database.Database): Set<string> {
  const rows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logger.warn({ dir: MIGRATIONS_DIR }, 'Migrations directory not found');
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export function runMigrations(db: Database.Database): string[] {
  ensureMigrationsTable(db);
  const applied = getApplied(db);
  const files = getMigrationFiles();
  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    logger.info({ migration: file }, 'Applying migration');

    // Skip the CREATE TABLE IF NOT EXISTS _migrations statement since we manage it separately
    const sqlWithoutMigrationsTable = sql.replace(
      /CREATE TABLE IF NOT EXISTS _migrations[\s\S]*?;/,
      ''
    );

    try {
      db.transaction(() => {
        db.exec(sqlWithoutMigrationsTable);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      })();
      ran.push(file);
      logger.info({ migration: file }, 'Migration applied successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ migration: file, err: msg }, 'Migration failed');
      throw new Error(`Migration ${file} failed: ${msg}`);
    }
  }

  if (ran.length === 0) {
    logger.info('All migrations already applied');
  }

  return ran;
}

export function getAppliedMigrations(db: Database.Database): string[] {
  ensureMigrationsTable(db);
  const rows = db.prepare('SELECT name FROM _migrations ORDER BY name').all() as {
    name: string;
  }[];
  return rows.map((r) => r.name);
}
