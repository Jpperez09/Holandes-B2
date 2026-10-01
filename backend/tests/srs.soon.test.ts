import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';

// docs/SPEC_2026-10_v2.md, P3: FSRS (short-term on) schedules "Again" about a minute
// out and "Good" on a new card about ten minutes out. Review used to load its queue
// once, so those cards never came back. GET /api/vocabulary/due?within_minutes=N
// lets the screen ask, when the queue ends, what is coming back soon.

let tmpDir: string;
let db: Database.Database;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-srs-soon-'));
  db = new Database(path.join(tmpDir, 'progress.sqlite'));
  db.pragma('foreign_keys = ON');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);
});

afterAll(async () => {
  db.close();
  if (existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  db.prepare('DELETE FROM vocabulary_reviews').run();
  db.prepare('DELETE FROM vocabulary_items').run();
});

let seq = 0;
const MIN = 60 * 1000;
const iso = (msFromNow: number): string => new Date(Date.now() + msFromNow).toISOString();

function insertCard(opts: { dueInMs: number; status?: string }): number {
  seq += 1;
  const info = db
    .prepare(`INSERT INTO vocabulary_items (lemma, language, status, fsrs_state) VALUES (?, 'nl', ?, ?)`)
    .run(`woord${seq}`, opts.status ?? 'learning', JSON.stringify({ due: iso(opts.dueInMs), state: 1 }));
  return Number(info.lastInsertRowid);
}

const ids = (cards: { id: number }[]) => cards.map((c) => c.id);

describe('getDueCards({ withinMinutes })', () => {
  it('without the option, cards that are not due yet stay out (the old behaviour)', async () => {
    const { getDueCards } = await import('../src/services/due-cards');
    insertCard({ dueInMs: 10 * MIN });
    expect(getDueCards(db)).toEqual([]);
  });

  it('adds the cards that come due within the window, soonest first, after the ones due now', async () => {
    const { getDueCards } = await import('../src/services/due-cards');
    const in15 = insertCard({ dueInMs: 15 * MIN });
    const overdue = insertCard({ dueInMs: -5 * MIN });
    const in5 = insertCard({ dueInMs: 5 * MIN });
    expect(ids(getDueCards(db, { withinMinutes: 20 }))).toEqual([overdue, in5, in15]);
  });

  it('leaves out cards beyond the window, and suspended or archived ones', async () => {
    const { getDueCards } = await import('../src/services/due-cards');
    const soon = insertCard({ dueInMs: 10 * MIN });
    insertCard({ dueInMs: 30 * MIN });
    insertCard({ dueInMs: 24 * 60 * MIN });
    insertCard({ dueInMs: 5 * MIN, status: 'suspended' });
    insertCard({ dueInMs: 5 * MIN, status: 'archived' });
    expect(ids(getDueCards(db, { withinMinutes: 20 }))).toEqual([soon]);
  });

  it('never lists a card twice', async () => {
    const { getDueCards } = await import('../src/services/due-cards');
    insertCard({ dueInMs: -1 * MIN });
    insertCard({ dueInMs: 2 * MIN });
    const list = ids(getDueCards(db, { withinMinutes: 20 }));
    expect(new Set(list).size).toBe(list.length);
  });

  it('ignores a window that is not a positive number', async () => {
    const { getDueCards } = await import('../src/services/due-cards');
    insertCard({ dueInMs: 5 * MIN });
    expect(getDueCards(db, { withinMinutes: 0 })).toEqual([]);
    expect(getDueCards(db, { withinMinutes: Number.NaN })).toEqual([]);
    expect(getDueCards(db, { withinMinutes: -3 })).toEqual([]);
  });
});

describe('why the screen asks for 20 minutes', () => {
  it('FSRS brings Again back in about a minute and Good on a new card in about ten', async () => {
    const { initializeCard, scheduleReview } = await import('../src/services/srs-fsrs');
    const now = new Date('2026-10-01T11:29:43.000Z');
    const minutes = (g: 1 | 2 | 3 | 4) =>
      (scheduleReview(initializeCard(), g, now).card.due.getTime() - now.getTime()) / MIN;

    expect(minutes(1)).toBeLessThanOrEqual(2); // Again
    expect(minutes(3)).toBeCloseTo(10, 0); // Good, the 11:29:43 -> 11:39:43 case from the spec
    expect(minutes(3)).toBeLessThanOrEqual(20);
    expect(minutes(4)).toBeGreaterThan(20); // Easy goes days out: no reason to wait for it
  });
});
