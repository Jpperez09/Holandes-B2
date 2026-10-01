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

// docs/SPEC_2026-10_v2.md, P7: ticking an activity of a module you have not studied
// releases its words to the SRS (they start coming up as new cards), and a tick by
// mistake could not be undone. DELETE /api/activities/:id/attempts undoes it.

let tmpDir: string;
let db: Database.Database;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-undo-'));
  db = new Database(path.join(tmpDir, 'progress.sqlite'));
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);

  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('vault_path', ?)`).run(resolveVaultPath());
  const { runFullIndex } = await import('../src/services/vault-indexer');
  await runFullIndex(resolveVaultPath(), { watch: false });

  const { default: activitiesRouter } = await import('../src/routes/activities');
  const app = express();
  app.use(express.json());
  app.use('/api/activities', activitiesRouter);
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
  if (existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  db.prepare('DELETE FROM activity_attempts').run();
  db.prepare('DELETE FROM vocabulary_reviews').run();
  db.prepare(`UPDATE vocabulary_items SET fsrs_state = NULL, status = 'new'`).run();
});

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

const tick = (id: number) => fetch(`${baseUrl}/api/activities/${id}/attempts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
const untick = async (id: string | number) => {
  const res = await fetch(`${baseUrl}/api/activities/${id}/attempts`, { method: 'DELETE' });
  return { status: res.status, body: (await res.json()) as any };
};

async function newCardModules(): Promise<string[]> {
  const { getDueCards } = await import('../src/services/due-cards');
  return [...new Set(getDueCards(db).map((c) => c.module_id ?? '?'))];
}

const percent = (moduleSourceId: string): number =>
  (
    db
      .prepare(
        `SELECT c.percent_complete AS p FROM v_module_completion c
           JOIN modules m ON m.id = c.module_id WHERE m.source_id = ?`,
      )
      .get(moduleSourceId) as { p: number }
  ).p;

describe('DELETE /api/activities/:id/attempts', () => {
  it('a tick by mistake releases the words of the module, and unticking takes them back', async () => {
    const [a1] = activityIds('MOD-003');
    expect(await newCardModules()).toEqual([]); // nothing started: no new cards

    expect((await tick(a1)).status).toBe(201);
    expect(await newCardModules()).toEqual(['MOD-003']);
    expect(percent('MOD-003')).toBeGreaterThan(0);

    const { status, body } = await untick(a1);
    expect(status).toBe(200);
    expect(body).toEqual({ activity_id: a1, removed: 1 });
    expect(await newCardModules()).toEqual([]);
    expect(percent('MOD-003')).toBe(0);
  });

  it('can be ticked again after it was undone', async () => {
    const [a1] = activityIds('MOD-003');
    await tick(a1);
    await untick(a1);
    await tick(a1);
    expect(await newCardModules()).toEqual(['MOD-003']);
  });

  it('only undoes that activity: the module stays started while another one is done', async () => {
    const [a1, a2] = activityIds('MOD-003');
    await tick(a1);
    await tick(a2);
    await untick(a1);
    expect(await newCardModules()).toEqual(['MOD-003']);
    const done = db.prepare(`SELECT activity_id FROM activity_attempts WHERE completed_at IS NOT NULL`).all() as { activity_id: number }[];
    expect(done.map((r) => r.activity_id)).toEqual([a2]);
  });

  it('is harmless on an activity that was never ticked, and leaves other modules alone', async () => {
    const [mod3] = activityIds('MOD-003');
    const [mod4] = activityIds('MOD-004');
    await tick(mod4);
    const { status, body } = await untick(mod3);
    expect(status).toBe(200);
    expect(body.removed).toBe(0);
    expect(await newCardModules()).toEqual(['MOD-004']);
  });

  it('removes every completed attempt of the activity (an older tick too), not other activities', async () => {
    const [a1, a2] = activityIds('MOD-003');
    await tick(a1);
    await tick(a1);
    await tick(a2);
    const { body } = await untick(a1);
    expect(body.removed).toBe(2);
    expect((db.prepare('SELECT COUNT(*) AS n FROM activity_attempts').get() as { n: number }).n).toBe(1);
  });

  it('does not undo what cannot be undone: a word already reviewed stays in the SRS with its history', async () => {
    const [a1] = activityIds('MOD-003');
    await tick(a1);
    const { getDueCards } = await import('../src/services/due-cards');
    const [first] = getDueCards(db);
    const state = JSON.stringify({ due: new Date(Date.now() + 86_400_000).toISOString(), state: 2 });
    db.prepare(`UPDATE vocabulary_items SET fsrs_state = ?, status = 'review' WHERE id = ?`).run(state, first.id);
    db.prepare(`INSERT INTO vocabulary_reviews (vocabulary_id, grade) VALUES (?, 3)`).run(first.id);

    await untick(a1);
    const kept = db.prepare('SELECT fsrs_state, status FROM vocabulary_items WHERE id = ?').get(first.id) as { fsrs_state: string; status: string };
    expect(kept).toEqual({ fsrs_state: state, status: 'review' });
    expect((db.prepare('SELECT COUNT(*) AS n FROM vocabulary_reviews').get() as { n: number }).n).toBe(1);
    expect(await newCardModules()).toEqual([]); // but the rest of the module's words are not served as new
  });

  it('answers 404 for an activity that does not exist and 400 for a bad id', async () => {
    expect((await untick(99_999_999)).status).toBe(404);
    expect((await untick('abc')).status).toBe(400);
  });
});
