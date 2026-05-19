import Database from 'better-sqlite3';
import { getDb } from '../db/connection';
import { logger } from '../config/logger';

export interface SettingsMap {
  [key: string]: string;
}

export function getAllSettings(): SettingsMap {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function updateSettings(updates: SettingsMap): void {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  );
  db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
      logger.debug({ key }, 'Setting updated');
    }

    // Mirror user_name → users.name
    if ('user_name' in updates) {
      db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = 1").run(
        updates['user_name']
      );
    }
  })();
}

export function getVaultPath(): string {
  return getSetting('vault_path') ?? '';
}

export function isVaultConfigured(): boolean {
  const vaultPath = getVaultPath();
  return vaultPath.trim().length > 0;
}
