import { promises as fs, existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { resolveVaultPath } from './fixtures/vaultPath';

// GET /api/stats/weekly — 7 local days ending on `end`.
// Fixtures sit around END = 2026-03-15, so the window is 2026-03-09..2026-03-15.
// Timestamps are written as "local time -> UTC" so the tests do not depend on
// the machine's time zone.

const END = '2026-03-15';
const START = '2026-03-09';

let tmpDir: string;
let db: Database.Database;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-weekly-'));
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

  const { default: statsRouter } = await import('../src/routes/stats');
  const app = express();
  app.use('/api/stats', statsRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const indexer = await import('../src/services/vault-indexer');
  await indexer.stopIndexer();
  db.close();
  if (existsSync(tmpDir)) {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  db.prepare('DELETE FROM activity_attempts').run();
  db.prepare('DELETE FROM vocabulary_reviews').run();
  db.prepare('DELETE FROM daily_logs').run();
  db.prepare(`UPDATE vocabulary_items SET fsrs_state = NULL, status = 'new'`).run();
});

const localAt = (day: string, time = '12:00:00'): string =>
  `datetime('${day} ${time}', 'utc')`;

function addLog(day: string, minutes: number): void {
  db.prepare(`INSERT INTO daily_logs (user_id, log_date, minutes) VALUES (1, ?, ?)`).run(
    day,
    minutes,
  );
}

function vocabIds(n: number): number[] {
  return (
    db.prepare(`SELECT id FROM vocabulary_items ORDER BY id LIMIT ?`).all(n) as { id: number }[]
  ).map((r) => r.id);
}

function addReview(vocabId: number, localDay: string, grade: number, time = '12:00:00'): void {
  db.prepare(
    `INSERT INTO vocabulary_reviews (vocabulary_id, reviewed_at, grade)
     VALUES (?, ${localAt(localDay, time)}, ?)`,
  ).run(vocabId, grade);
}

function activityIds(moduleSourceId: string): number[] {
  return (
    db
      .prepare(
        `SELECT a.id FROM activities a
           JOIN lessons l ON l.id = a.lesson_id
           JOIN modules m ON m.id = l.module_id
          WHERE m.source_id = ? ORDER BY a.sort_order`,
      )
      .all(moduleSourceId) as { id: number }[]
  ).map((r) => r.id);
}

function completeActivity(activityId: number, localDay: string): void {
  db.prepare(
    `INSERT INTO activity_attempts (user_id, activity_id, started_at, completed_at)
     VALUES (1, ?, ${localAt(localDay)}, ${localAt(localDay)})`,
  ).run(activityId);
}

type Weekly = Awaited<ReturnType<typeof getWeekly>>;
async function getWeekly(query = `?end=${END}`) {
  const res = await fetch(`${baseUrl}/api/stats/weekly${query}`);
  return { status: res.status, body: (await res.json()) as any };
}

describe('GET /api/stats/weekly — window and minutes', () => {
  it('covers exactly 7 days ending on `end`', async () => {
    const { status, body } = await getWeekly();
    expect(status).toBe(200);
    expect(body.start).toBe(START);
    expect(body.end).toBe(END);
    expect(body.minutesPerDay.map((d: { date: string }) => d.date)).toEqual([
      '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15',
    ]);
  });

  it('crosses month boundaries correctly', async () => {
    const { body } = await getWeekly('?end=2026-03-02');
    expect(body.start).toBe('2026-02-24');
  });

  it('reports minutes per day from daily_logs, 0 for days without a log, ignoring days outside', async () => {
    addLog('2026-03-08', 99); // before the window
    addLog('2026-03-09', 30);
    addLog('2026-03-11', 45);
    addLog('2026-03-15', 25);
    addLog('2026-03-16', 99); // after the window
    const { body } = await getWeekly();
    expect(body.minutesPerDay.map((d: { minutes: number }) => d.minutes)).toEqual([30, 0, 45, 0, 0, 0, 25]);
    expect(body.totalMinutes).toBe(100);
  });

  it('defaults `end` to today (local day)', async () => {
    const today = (db.prepare(`SELECT date('now','localtime') AS d`).get() as { d: string }).d;
    const { status, body } = await getWeekly('');
    expect(status).toBe(200);
    expect(body.end).toBe(today);
    expect(body.minutesPerDay).toHaveLength(7);
  });

  it.each(['2026-02-31', '15-03-2026', 'abc', '2026-3-5', ''])(
    'rejects an invalid end (%s) with 422',
    async (bad) => {
      const { status, body } = await getWeekly(`?end=${encodeURIComponent(bad)}`);
      expect(status).toBe(422);
      expect(body.title).toBe('Validation Error');
    },
  );

  it('rejects a repeated end parameter', async () => {
    const { status } = await getWeekly(`?end=${END}&end=2026-03-16`);
    expect(status).toBe(422);
  });
});

describe('GET /api/stats/weekly — reviews and new cards', () => {
  it('counts reviews in the window and the share graded 3 or better', async () => {
    const [a, b, c] = vocabIds(3);
    addReview(a, '2026-03-09', 1);
    addReview(a, '2026-03-10', 2);
    addReview(b, '2026-03-12', 3);
    addReview(c, '2026-03-14', 4);
    addReview(c, '2026-03-15', 4);
    const { body } = await getWeekly();
    expect(body.reviews).toEqual({ count: 5, goodOrBetter: 3, percentGoodOrBetter: 60 });
  });

  it('ignores reviews on the days just outside the window', async () => {
    const [a, b] = vocabIds(2);
    addReview(a, '2026-03-08', 4);
    addReview(b, '2026-03-16', 4);
    const { body } = await getWeekly();
    expect(body.reviews.count).toBe(0);
  });

  it('gives a null percentage (not 0) when there were no reviews', async () => {
    const { body } = await getWeekly();
    expect(body.reviews).toEqual({ count: 0, goodOrBetter: 0, percentGoodOrBetter: null });
    expect(body.text).toContain('Reviews: 0');
  });

  it('counts a card as new only when its FIRST review falls inside the window', async () => {
    const [firstInWindow, firstBefore, firstAfter] = vocabIds(3);
    addReview(firstInWindow, '2026-03-10', 3);
    addReview(firstInWindow, '2026-03-11', 3); // second review: still one new card
    addReview(firstBefore, '2026-03-05', 3);
    addReview(firstBefore, '2026-03-12', 3); // re-review in window: a review, not a new card
    addReview(firstAfter, '2026-03-16', 3);
    const { body } = await getWeekly();
    expect(body.newCardsIntroduced).toBe(1);
    expect(body.reviews.count).toBe(3);
  });

  it('counts overdue cards as pending', async () => {
    const [overdue, future] = vocabIds(2);
    const hourAgo = JSON.stringify({ due: new Date(Date.now() - 3600_000).toISOString(), state: 2 });
    const inAnHour = JSON.stringify({ due: new Date(Date.now() + 3600_000).toISOString(), state: 2 });
    db.prepare(`UPDATE vocabulary_items SET fsrs_state = ?, status = 'review' WHERE id = ?`).run(hourAgo, overdue);
    db.prepare(`UPDATE vocabulary_items SET fsrs_state = ?, status = 'review' WHERE id = ?`).run(inAnHour, future);
    const { body } = await getWeekly();
    expect(body.dueCardsPending).toBe(1);
  });
});

describe('GET /api/stats/weekly — modules completed', () => {
  it('counts a module once every activity is done, dated by the last first-completion', async () => {
    const ids = activityIds('MOD-001');
    expect(ids.length).toBeGreaterThan(1);
    ids.slice(0, -1).forEach((id) => completeActivity(id, '2026-03-02')); // before the window
    completeActivity(ids[ids.length - 1], '2026-03-12');
    const { body } = await getWeekly();
    expect(body.modulesCompleted.count).toBe(1);
    expect(body.modulesCompleted.items[0]).toMatchObject({ id: 'MOD-001', completedOn: '2026-03-12' });
    expect(body.modulesCompleted.items[0].title).toBeTruthy();
  });

  it('does not count a module that is only partly done', async () => {
    const ids = activityIds('MOD-002');
    ids.slice(0, ids.length - 1).forEach((id) => completeActivity(id, '2026-03-12'));
    const { body } = await getWeekly();
    expect(body.modulesCompleted.count).toBe(0);
  });

  it('does not count a module finished before the window, even if re-attempted inside it', async () => {
    const ids = activityIds('MOD-003');
    ids.forEach((id) => completeActivity(id, '2026-03-01'));
    completeActivity(ids[0], '2026-03-12'); // a second attempt must not move the completion date
    const { body } = await getWeekly();
    expect(body.modulesCompleted.count).toBe(0);
  });

  it('ignores an attempt that was started but never completed', async () => {
    const ids = activityIds('MOD-004');
    ids.slice(0, -1).forEach((id) => completeActivity(id, '2026-03-12'));
    db.prepare(
      `INSERT INTO activity_attempts (user_id, activity_id, started_at, completed_at)
       VALUES (1, ?, ${localAt('2026-03-12')}, NULL)`,
    ).run(ids[ids.length - 1]);
    const { body } = await getWeekly();
    expect(body.modulesCompleted.count).toBe(0);
  });
});

// In the evening (local) the UTC date is already "tomorrow". Colombia is UTC-5,
// so 23:59 local is 04:59 UTC the next day. Each test below isolates one edge so
// a UTC-based implementation cannot be rescued by errors that cancel out.
describe('GET /api/stats/weekly — local-day edges', () => {
  it('counts a review made at 23:59 local on the last day of the window', async () => {
    const [a] = vocabIds(1);
    addReview(a, END, 3, '23:59:00');
    const { body } = await getWeekly();
    expect(body.reviews.count).toBe(1);
    expect(body.newCardsIntroduced).toBe(1);
  });

  it('does not count a review made at 23:59 local on the day before the window', async () => {
    const [a] = vocabIds(1);
    addReview(a, '2026-03-08', 3, '23:59:00');
    const { body } = await getWeekly();
    expect(body.reviews.count).toBe(0);
    expect(body.newCardsIntroduced).toBe(0);
  });

  it('dates a module by its local completion day', async () => {
    const ids = activityIds('MOD-001');
    ids.slice(0, -1).forEach((id) => completeActivity(id, '2026-03-02'));
    db.prepare(
      `INSERT INTO activity_attempts (user_id, activity_id, started_at, completed_at)
       VALUES (1, ?, ${localAt('2026-03-08', '23:59:00')}, ${localAt('2026-03-08', '23:59:00')})`,
    ).run(ids[ids.length - 1]);
    const { body } = await getWeekly();
    // Finished the evening before the window starts: not part of this week.
    expect(body.modulesCompleted.count).toBe(0);
  });
});

describe('weekly plain-text summary', () => {
  it('lists every figure on its own line, ready to paste', async () => {
    addLog('2026-03-09', 30);
    addLog('2026-03-11', 45);
    const [a, b] = vocabIds(2);
    addReview(a, '2026-03-10', 3);
    addReview(b, '2026-03-12', 1);
    activityIds('MOD-001').forEach((id) => completeActivity(id, '2026-03-12'));

    const { body }: Weekly = await getWeekly();
    const lines = (body.text as string).split('\n');
    expect(lines[0]).toBe(`Weekly summary: ${START} to ${END}`);
    expect(lines).toContain('Minutes studied: 75');
    expect(lines).toContain('  Mon 2026-03-09: 30');
    expect(lines).toContain('  Wed 2026-03-11: 45');
    expect(lines).toContain('  Sun 2026-03-15: 0');
    expect(lines.find((l) => l.startsWith('Modules completed: 1 (MOD-001'))).toBeDefined();
    expect(lines).toContain('Reviews: 2 (50% graded Good or Easy)');
    expect(lines).toContain('New cards introduced: 2');
    expect(lines).toContain('Due cards pending: 0');
  });
});
