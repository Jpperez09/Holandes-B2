import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { resolveVaultPath } from './fixtures/vaultPath';

// Regression tests for "Review serves new cards from modules I haven't studied".
//
// GET /api/vocabulary/due used to UNION every status='new' card with no module
// filter, no order and LIMIT 50 (24 cards from MOD-002, 14 from MOD-003, ...).
// New cards must now come only from started modules, in module order, capped
// by the new_cards_per_day setting (default 10, counted per local day).

let tmpDir: string;
let db: Database.Database;

// MOD-001 has exactly 10 lemmas, so cap tests need a module with more than 10.
const BIG_MODULE = 'MOD-002';

type DueCard = { id: number; module_id: string | null; fsrs_state: string | null; status: string };

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-srs-new-'));
  db = new Database(path.join(tmpDir, 'progress.sqlite'));
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);

  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('vault_path', ?)`).run(
    resolveVaultPath(),
  );
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

beforeEach(() => {
  // Back to a "clean database": nothing studied, nothing reviewed, default cap.
  db.prepare('DELETE FROM activity_attempts').run();
  db.prepare('DELETE FROM vocabulary_reviews').run();
  db.prepare(`UPDATE vocabulary_items SET fsrs_state = NULL, status = 'new'`).run();
  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('new_cards_per_day', '10')`).run();
});

async function dueCards(): Promise<DueCard[]> {
  const { getDueCards } = await import('../src/services/due-cards');
  return getDueCards(db) as unknown as DueCard[];
}

/** Mark a module as started: one activity attempt with completed_at set. */
function startModule(sourceId: string, completed = true): void {
  const row = db
    .prepare(
      `SELECT a.id AS activity_id
         FROM activities a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN modules m ON m.id = l.module_id
        WHERE m.source_id = ?
        ORDER BY a.sort_order LIMIT 1`,
    )
    .get(sourceId) as { activity_id: number } | undefined;
  if (!row) throw new Error(`No activity indexed for ${sourceId}`);
  db.prepare(
    `INSERT INTO activity_attempts (user_id, activity_id, started_at, completed_at)
     VALUES (1, ?, datetime('now'), ${completed ? "datetime('now')" : 'NULL'})`,
  ).run(row.activity_id);
}

function newCardCount(moduleId: string): number {
  return (
    db
      .prepare(`SELECT COUNT(*) AS n FROM vocabulary_items WHERE module_id = ? AND status = 'new'`)
      .get(moduleId) as { n: number }
  ).n;
}

/**
 * Record the first-ever review of `count` cards from `moduleId`, at the given
 * UTC timestamp SQL expression, and move those cards out of the "new" pool.
 */
function introduceCards(moduleId: string, count: number, reviewedAtSql: string): number[] {
  const ids = (
    db
      .prepare(
        `SELECT id FROM vocabulary_items
          WHERE module_id = ? AND status = 'new' ORDER BY id LIMIT ?`,
      )
      .all(moduleId, count) as { id: number }[]
  ).map((r) => r.id);
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  for (const id of ids) {
    db.prepare(
      `INSERT INTO vocabulary_reviews (vocabulary_id, reviewed_at, grade) VALUES (?, ${reviewedAtSql}, 3)`,
    ).run(id);
    db.prepare(`UPDATE vocabulary_items SET fsrs_state = ?, status = 'learning' WHERE id = ?`).run(
      JSON.stringify({ due, state: 1 }),
      id,
    );
  }
  return ids;
}

describe('new cards come only from started modules', () => {
  it('a clean database with no started module yields 0 new cards', async () => {
    // Sanity: the seed really does contain plenty of new cards...
    expect(newCardCount('MOD-001') + newCardCount('MOD-002') + newCardCount('MOD-003')).toBeGreaterThan(50);
    // ...but none of them may be served.
    expect(await dueCards()).toEqual([]);
  });

  it('a module with only an unfinished attempt (no completed_at) is not started', async () => {
    startModule('MOD-002', false);
    expect(await dueCards()).toEqual([]);
  });

  it('with MOD-001 started, serves only MOD-001 cards, at most 10', async () => {
    startModule('MOD-001');
    const cards = await dueCards();
    expect(cards.length).toBe(Math.min(10, newCardCount('MOD-001')));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.module_id === 'MOD-001')).toBe(true);
    expect(cards.every((c) => c.status === 'new' && c.fsrs_state === null)).toBe(true);
  });

  it('orders new cards by module sort_order, then id', async () => {
    db.prepare(`UPDATE settings SET value = '100' WHERE key = 'new_cards_per_day'`).run();
    startModule('MOD-002'); // started out of order on purpose
    startModule('MOD-001');
    const cards = await dueCards();

    const moduleOrder = (
      db.prepare(`SELECT source_id FROM modules ORDER BY sort_order`).all() as { source_id: string }[]
    ).map((r) => r.source_id);
    const rank = (c: DueCard) => moduleOrder.indexOf(c.module_id as string);

    expect(new Set(cards.map((c) => c.module_id))).toEqual(new Set(['MOD-001', 'MOD-002']));
    for (let i = 1; i < cards.length; i++) {
      const [a, b] = [cards[i - 1], cards[i]];
      expect(rank(a) < rank(b) || (rank(a) === rank(b) && a.id < b.id)).toBe(true);
    }
  });
});

describe('daily cap (new_cards_per_day, counted per local day)', () => {
  it('precondition: the module used by the cap tests has more than 10 lemmas', () => {
    expect(newCardCount(BIG_MODULE)).toBeGreaterThan(10);
  });

  it('defaults to 10 when the setting row is missing', async () => {
    db.prepare(`DELETE FROM settings WHERE key = 'new_cards_per_day'`).run();
    startModule(BIG_MODULE);
    expect((await dueCards()).length).toBe(Math.min(10, newCardCount(BIG_MODULE)));
  });

  it('honours a custom cap', async () => {
    db.prepare(`UPDATE settings SET value = '4' WHERE key = 'new_cards_per_day'`).run();
    startModule(BIG_MODULE);
    expect((await dueCards()).length).toBe(4);
  });

  it('serves 0 new cards once the cap was already used today', async () => {
    startModule(BIG_MODULE);
    introduceCards(BIG_MODULE, 10, `datetime('now')`);
    // The module still has new cards left, but today's 10 are used up.
    expect(newCardCount(BIG_MODULE)).toBeGreaterThan(0);
    const newOnes = (await dueCards()).filter((c) => c.status === 'new');
    expect(newOnes).toEqual([]);
  });

  it('serves only the remaining budget when part of the cap is used', async () => {
    startModule(BIG_MODULE);
    introduceCards(BIG_MODULE, 6, `datetime('now')`);
    const newOnes = (await dueCards()).filter((c) => c.status === 'new');
    expect(newOnes.length).toBe(Math.min(4, newCardCount(BIG_MODULE)));
  });

  it('counts the introduction day in local time: a first review at local noon today counts', async () => {
    startModule(BIG_MODULE);
    // Local 12:00 today, converted to UTC. On a UTC-5 machine in the evening
    // its UTC date is already "tomorrow", which a UTC-based count would miss.
    introduceCards(BIG_MODULE, 10, `datetime(date('now','localtime') || ' 12:00:00', 'utc')`);
    expect((await dueCards()).filter((c) => c.status === 'new')).toEqual([]);
  });

  it('does not count a first review from yesterday (local day), even if its UTC date is today', async () => {
    startModule(BIG_MODULE);
    // Local 22:30 yesterday == 03:30 UTC today on a UTC-5 machine.
    introduceCards(
      BIG_MODULE,
      10,
      `datetime(date('now','localtime','-1 day') || ' 22:30:00', 'utc')`,
    );
    const newOnes = (await dueCards()).filter((c) => c.status === 'new');
    expect(newOnes.length).toBe(Math.min(10, newCardCount(BIG_MODULE)));
    expect(newOnes.length).toBeGreaterThan(0);
  });

  it('counts a card once, by its FIRST review: yesterday-first + today-again is not introduced today', async () => {
    startModule(BIG_MODULE);
    const ids = introduceCards(
      BIG_MODULE,
      10,
      `datetime(date('now','localtime','-1 day') || ' 12:00:00', 'utc')`,
    );
    for (const id of ids) {
      db.prepare(
        `INSERT INTO vocabulary_reviews (vocabulary_id, reviewed_at, grade) VALUES (?, datetime('now'), 3)`,
      ).run(id);
    }
    const newOnes = (await dueCards()).filter((c) => c.status === 'new');
    expect(newOnes.length).toBe(Math.min(10, newCardCount(BIG_MODULE)));
  });
});

describe('overdue cards are unaffected by the new-card rules', () => {
  it('still lists overdue cards from any module, ahead of new cards', async () => {
    startModule('MOD-001');
    const [overdueId] = (
      db
        .prepare(`SELECT id FROM vocabulary_items WHERE module_id = 'MOD-003' ORDER BY id LIMIT 1`)
        .all() as { id: number }[]
    ).map((r) => r.id);
    db.prepare(`UPDATE vocabulary_items SET fsrs_state = ?, status = 'review' WHERE id = ?`).run(
      JSON.stringify({ due: new Date(Date.now() - 3600_000).toISOString(), state: 2 }),
      overdueId,
    );
    const cards = await dueCards();
    expect(cards[0].id).toBe(overdueId);
    expect(cards.slice(1).every((c) => c.module_id === 'MOD-001' && c.status === 'new')).toBe(true);
  });
});
