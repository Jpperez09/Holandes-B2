import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { resolveVaultPath } from './fixtures/vaultPath';

let tmpDir: string;
let dbPath: string;
let db: Database.Database;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-routes-'));
  dbPath = path.join(tmpDir, 'progress.sqlite');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);

  // Seed settings (vault_path) and index once.
  db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('vault_path', ?)`,
  ).run(resolveVaultPath());

  const { runFullIndex } = await import('../src/services/vault-indexer');
  await runFullIndex(resolveVaultPath(), { watch: false });
});

afterAll(async () => {
  const indexer = await import('../src/services/vault-indexer');
  await indexer.stopIndexer();
  db.close();
  if (existsSync(tmpDir)) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

describe('routes use the same SQL contract the live API does', () => {
  it('"GET /api/modules" SQL returns ≥5 modules with cefr_band populated', () => {
    const rows = db
      .prepare(
        `SELECT m.*, COALESCE(vc.percent_complete, 0.0) AS percent_complete
           FROM modules m
           LEFT JOIN v_module_completion vc ON vc.module_id = m.id
          ORDER BY m.sort_order, m.slug`,
      )
      .all() as Array<{ slug: string; cefr_band: string | null; source_id: string }>;
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows[0].source_id).toBe('MOD-001');
    expect(rows.every((r) => r.cefr_band !== null)).toBe(true);
  });

  it('"GET /api/levels" SQL returns ≥5 levels and each has a parsed cefr_band', () => {
    const rows = db
      .prepare(
        `SELECT l.*, (SELECT COUNT(*) FROM modules WHERE level_id = l.id) AS module_count
           FROM levels l ORDER BY l.sort_order, l.code`,
      )
      .all() as Array<{ code: string; cefr_band: string | null; module_count: number }>;
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows[0].code).toBe('1');
    expect(rows[0].cefr_band).toBe('A0-A1');
    expect(rows[0].module_count).toBeGreaterThanOrEqual(1);
  });

  it('"GET /api/vocabulary" SQL returns ≥100 items', () => {
    const total = (db.prepare('SELECT COUNT(*) AS cnt FROM vocabulary_items').get() as {
      cnt: number;
    }).cnt;
    expect(total).toBeGreaterThanOrEqual(100);
  });

  it('"GET /api/vocabulary/due" returns brand-new cards before any reviews', () => {
    const cards = db
      .prepare(
        `SELECT * FROM v_due_cards
         UNION ALL
         SELECT * FROM vocabulary_items
         WHERE status = 'new' AND fsrs_state IS NULL
         LIMIT 50`,
      )
      .all() as Array<{ lemma: string; status: string }>;
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.status !== 'suspended' && c.status !== 'archived')).toBe(true);
  });

  it('"GET /api/modules/MOD-001" returns its activities + linked vocabulary', () => {
    const mod = db
      .prepare(
        `SELECT m.* FROM modules m WHERE m.slug = ? OR m.source_id = ? LIMIT 1`,
      )
      .get('MOD-001', 'MOD-001') as { id: number; source_id: string } | undefined;
    expect(mod).toBeDefined();

    const activities = db
      .prepare(
        `SELECT a.* FROM activities a
           JOIN lessons l ON l.id = a.lesson_id
          WHERE l.module_id = ?
          ORDER BY l.sort_order, a.sort_order`,
      )
      .all(mod!.id) as Array<{ slug: string; type: string; title: string }>;
    expect(activities.length).toBe(7);
    expect(activities.map((a) => a.slug)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);

    const vocabulary = db
      .prepare('SELECT lemma, article FROM vocabulary_items WHERE module_id = ?')
      .all(mod!.source_id) as Array<{ lemma: string; article: string | null }>;
    expect(vocabulary.length).toBeGreaterThanOrEqual(5);
    expect(vocabulary.find((v) => v.lemma === 'hallo')).toBeDefined();
  });

  it('"GET /api/progress" SQL surfaces vocab status counts and grammar mastery', () => {
    const vocabStats = db
      .prepare('SELECT status, COUNT(*) AS count FROM vocabulary_items GROUP BY status')
      .all() as Array<{ status: string; count: number }>;
    expect(vocabStats.some((row) => row.status === 'new' && row.count > 0)).toBe(true);

    const grammarRows = db
      .prepare(
        `SELECT slug, title, mastery FROM grammar_topics ORDER BY mastery DESC`,
      )
      .all() as Array<{ slug: string; title: string; mastery: number }>;
    expect(grammarRows.length).toBeGreaterThanOrEqual(6);
  });
});

describe('daily log writer integrates with vault path setting', () => {
  it('writes a daily log atomically into a temp vault and reads it back', async () => {
    const { writeDailyLog, readDailyLog } = await import(
      '../src/services/dailyLogWriter'
    );

    const fakeVault = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-daily-route-'));
    try {
      const result = await writeDailyLog({
        vault_path: fakeVault,
        date: '2026-05-19',
        notes: 'integration ping',
        auto_summary: '## Summary\n\n- 0 cards reviewed',
        meta: { minutes: 10, activities: 0, streak: 1 },
      });
      expect(result.created).toBe(true);
      expect(result.markdown_path.endsWith('/04_Daily_Logs/2026-05-19.md')).toBe(true);

      const round = await readDailyLog(fakeVault, '2026-05-19');
      expect(round).not.toBeNull();
      expect(round!.content).toContain('integration ping');
      expect(round!.content).toContain('app:summary:begin');
    } finally {
      await fs.rm(fakeVault, { recursive: true, force: true });
    }
  });
});
