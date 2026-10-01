import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';

// Regression tests for the "due cards don't show up until tomorrow" bug.
//
// v_due_cards used to compare json_extract(fsrs_state, '$.due') — an ISO string
// like 2026-09-30T10:00:00.000Z — against datetime('now') — 2026-09-30 22:40:47 —
// as plain text. 'T' sorts after ' ', so a card that came due earlier on the
// same UTC day was hidden until the next day.

let tmpDir: string;
let db: Database.Database;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-srs-due-'));
  db = new Database(path.join(tmpDir, 'progress.sqlite'));
  db.pragma('foreign_keys = ON');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);
});

afterAll(async () => {
  db.close();
  if (existsSync(tmpDir)) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  db.prepare('DELETE FROM vocabulary_items').run();
});

let seq = 0;
function insertCard(opts: { due: string | null; status?: string }): number {
  seq += 1;
  const fsrsState = opts.due === null ? null : JSON.stringify({ due: opts.due, state: 2 });
  const info = db
    .prepare(
      `INSERT INTO vocabulary_items (lemma, language, status, fsrs_state)
       VALUES (?, 'nl', ?, ?)`,
    )
    .run(`woord${seq}`, opts.status ?? 'review', fsrsState);
  return Number(info.lastInsertRowid);
}

function dueIds(): number[] {
  return (db.prepare('SELECT id FROM v_due_cards ORDER BY id').all() as { id: number }[]).map(
    (r) => r.id,
  );
}

const iso = (msFromNow: number): string => new Date(Date.now() + msFromNow).toISOString();

describe('v_due_cards compares due timestamps as datetimes, not text', () => {
  it('lists a card that came due 1 hour ago', () => {
    const id = insertCard({ due: iso(-60 * 60 * 1000) });
    expect(dueIds()).toEqual([id]);
  });

  it('lists a card that came due earlier today (UTC), the exact case the text compare hid', () => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const id = insertCard({ due: `${todayUtc}T00:00:00.000Z` });
    expect(dueIds()).toEqual([id]);
  });

  it('lists a card that came due yesterday', () => {
    const id = insertCard({ due: iso(-24 * 60 * 60 * 1000) });
    expect(dueIds()).toEqual([id]);
  });

  it('does not list a card that is due in 1 hour', () => {
    insertCard({ due: iso(60 * 60 * 1000) });
    expect(dueIds()).toEqual([]);
  });

  it('does not list suspended or archived cards, even when overdue', () => {
    insertCard({ due: iso(-60 * 60 * 1000), status: 'suspended' });
    insertCard({ due: iso(-60 * 60 * 1000), status: 'archived' });
    expect(dueIds()).toEqual([]);
  });

  it('does not list brand-new cards that have no FSRS state', () => {
    insertCard({ due: null, status: 'new' });
    expect(dueIds()).toEqual([]);
  });
});

describe('plan generator counts due cards the same way', () => {
  it('counts a card that came due 1 hour ago', async () => {
    insertCard({ due: iso(-60 * 60 * 1000) });
    insertCard({ due: iso(60 * 60 * 1000) });
    const { generatePlan } = await import('../src/services/plan-generator');
    expect(generatePlan().dueCardCount).toBe(1);
  });
});
