import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { resolveVaultPath } from './fixtures/vaultPath';

// We patch the singleton DB connection in `db/connection.ts` to point at a
// tmp SQLite file so the test doesn't touch the dev DB.
let tmpDir: string;
let dbPath: string;
let db: Database.Database;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-indexer-'));
  dbPath = path.join(tmpDir, 'progress.sqlite');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Inject the test DB into the connection singleton.
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);

  runMigrations(db);
});

afterAll(async () => {
  // Stop the indexer so chokidar releases handles before we delete the tmp dir.
  const indexer = await import('../src/services/vault-indexer');
  await indexer.stopIndexer();
  db.close();
  if (existsSync(tmpDir)) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

describe('vault-indexer × SQLite integration', () => {
  it('runFullIndex populates the DB from the live vault', async () => {
    const { runFullIndex } = await import('../src/services/vault-indexer');
    const state = await runFullIndex(resolveVaultPath(), { watch: false });

    expect(state.ready).toBe(true);
    expect(state.errors).toEqual([]);
    expect(state.moduleCount).toBeGreaterThanOrEqual(5);
    expect(state.levelCount).toBeGreaterThanOrEqual(5);
    expect(state.vocabCount).toBeGreaterThanOrEqual(100);

    const modules = db.prepare('SELECT slug, source_id, title, cefr_band FROM modules ORDER BY sort_order').all() as Array<{
      slug: string;
      source_id: string | null;
      title: string;
      cefr_band: string | null;
    }>;
    expect(modules.length).toBeGreaterThanOrEqual(5);
    expect(modules[0].source_id).toBe('MOD-001');
    expect(modules[0].cefr_band).toBe('A0-A1');

    const levels = db.prepare('SELECT code, title, cefr_band FROM levels ORDER BY sort_order').all() as Array<{
      code: string;
      title: string | null;
      cefr_band: string | null;
    }>;
    expect(levels.length).toBeGreaterThanOrEqual(5);
    expect(levels[0].code).toBe('1');
    expect(levels[0].cefr_band).toBe('A0-A1');

    const vocab = db.prepare('SELECT COUNT(*) AS cnt FROM vocabulary_items').get() as { cnt: number };
    expect(vocab.cnt).toBeGreaterThanOrEqual(100);

    const activities = db.prepare('SELECT COUNT(*) AS cnt FROM activities').get() as { cnt: number };
    expect(activities.cnt).toBeGreaterThan(0);

    const grammar = db.prepare('SELECT COUNT(*) AS cnt FROM grammar_topics').get() as { cnt: number };
    expect(grammar.cnt).toBeGreaterThanOrEqual(6);
  });

  it('repeated runFullIndex does not duplicate rows', async () => {
    const { runFullIndex } = await import('../src/services/vault-indexer');
    const before = {
      modules: (db.prepare('SELECT COUNT(*) AS cnt FROM modules').get() as { cnt: number }).cnt,
      levels: (db.prepare('SELECT COUNT(*) AS cnt FROM levels').get() as { cnt: number }).cnt,
      vocabulary: (db.prepare('SELECT COUNT(*) AS cnt FROM vocabulary_items').get() as { cnt: number }).cnt,
      activities: (db.prepare('SELECT COUNT(*) AS cnt FROM activities').get() as { cnt: number }).cnt,
      grammar: (db.prepare('SELECT COUNT(*) AS cnt FROM grammar_topics').get() as { cnt: number }).cnt,
    };

    await runFullIndex(resolveVaultPath(), { watch: false });

    const after = {
      modules: (db.prepare('SELECT COUNT(*) AS cnt FROM modules').get() as { cnt: number }).cnt,
      levels: (db.prepare('SELECT COUNT(*) AS cnt FROM levels').get() as { cnt: number }).cnt,
      vocabulary: (db.prepare('SELECT COUNT(*) AS cnt FROM vocabulary_items').get() as { cnt: number }).cnt,
      activities: (db.prepare('SELECT COUNT(*) AS cnt FROM activities').get() as { cnt: number }).cnt,
      grammar: (db.prepare('SELECT COUNT(*) AS cnt FROM grammar_topics').get() as { cnt: number }).cnt,
    };

    expect(after).toEqual(before);
  });

  it('maps de/het articles and module_id correctly for a vocab item', async () => {
    const huis = db
      .prepare('SELECT lemma, article, module_id, translation_en FROM vocabulary_items WHERE lemma = ?')
      .get('huis') as { lemma: string; article: string; module_id: string; translation_en: string } | undefined;
    expect(huis).toBeDefined();
    expect(huis!.article).toBe('het');
    expect(huis!.module_id).toBe('MOD-004');
    expect(huis!.translation_en).toBe('house');
  });

  it('preserves grammar pattern slugs and pienemann stages', async () => {
    const v2 = db
      .prepare("SELECT slug, title, pienemann_stage FROM grammar_topics WHERE slug = ?")
      .get('v2-main-clause') as { slug: string; title: string; pienemann_stage: number | null } | undefined;
    expect(v2).toBeDefined();
    expect(v2!.pienemann_stage).not.toBeNull();
  });
});
