import { promises as fs, existsSync, readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';

// docs/SPEC_2026-10_v2.md, P5: the `study_calendar` setting says what Today proposes
// each weekday. Default: standard module Mon/Tue/Thu/Fri, the week's review on
// Saturday, review only (and "Hoy toca portugués") on Wednesday and Sunday.

let tmpDir: string;
let db: Database.Database;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-calendar-'));
  db = new Database(path.join(tmpDir, 'progress.sqlite'));
  db.pragma('foreign_keys = ON');
  const conn = await import('../src/db/connection');
  conn.setDbForTesting(db);
  runMigrations(db);

  const { default: settingsRouter } = await import('../src/routes/settings');
  const app = express();
  app.use(express.json());
  app.use('/api/settings', settingsRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
  if (existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
});

const patch = async (body: unknown) => {
  const res = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json().catch(() => null)) as any };
};

describe('study_calendar default', () => {
  it('is seeded by a migration with the days from the spec', async () => {
    const { DEFAULT_STUDY_CALENDAR } = await import('../src/services/study-calendar');
    const stored = (db.prepare(`SELECT value FROM settings WHERE key = 'study_calendar'`).get() as { value: string }).value;
    expect(JSON.parse(stored)).toEqual(JSON.parse(DEFAULT_STUDY_CALENDAR));
    expect(JSON.parse(stored)).toMatchObject({
      mon: 'module',
      tue: 'module',
      wed: 'review-only',
      thu: 'module',
      fri: 'module',
      sat: 'weekly-review',
      sun: 'review-only',
      review_only_note: 'Hoy toca portugués',
      weekly_review_start: '2026-10-03',
    });
  });

  it('is the same text in the migration file and in the code, and passes its own validation', async () => {
    const { DEFAULT_STUDY_CALENDAR, validateStudyCalendar } = await import('../src/services/study-calendar');
    const sql = readFileSync(path.resolve(__dirname, '../migrations/008_study_calendar.sql'), 'utf8');
    expect(sql).toContain(DEFAULT_STUDY_CALENDAR);
    expect(validateStudyCalendar(DEFAULT_STUDY_CALENDAR)).toBeNull();
  });

  it('is served by GET /api/settings', async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    const body = (await res.json()) as Record<string, string>;
    expect(JSON.parse(body['study_calendar']).sat).toBe('weekly-review');
  });
});

describe('validateStudyCalendar', () => {
  it('accepts a partial calendar (missing days fall back to the default when read)', async () => {
    const { validateStudyCalendar } = await import('../src/services/study-calendar');
    expect(validateStudyCalendar('{"wed":"module"}')).toBeNull();
    expect(validateStudyCalendar('{}')).toBeNull();
  });

  it.each([
    ['not json', 'not json'],
    ['an array', '[]'],
    ['null', 'null'],
    ['an unknown mode', '{"mon":"holiday"}'],
    ['a mode that is not a string', '{"mon":1}'],
    ['a misspelt day', '{"mom":"module"}'],
    ['a review start that is not a date', '{"weekly_review_start":"3 oct"}'],
    ['an impossible review start date', '{"weekly_review_start":"2026-02-31"}'],
    ['a note that is not text', '{"review_only_note":5}'],
  ])('rejects %s', async (_label, raw) => {
    const { validateStudyCalendar } = await import('../src/services/study-calendar');
    expect(validateStudyCalendar(raw)).toEqual(expect.any(String));
  });
});

describe('PATCH /api/settings with study_calendar', () => {
  it('rejects an invalid calendar with 422 and keeps the stored one', async () => {
    const before = (db.prepare(`SELECT value FROM settings WHERE key = 'study_calendar'`).get() as { value: string }).value;
    const { status, body } = await patch({ study_calendar: '{"mon":"holiday"}' });
    expect(status).toBe(422);
    expect(body.detail).toMatch(/study_calendar/);
    const after = (db.prepare(`SELECT value FROM settings WHERE key = 'study_calendar'`).get() as { value: string }).value;
    expect(after).toBe(before);
  });

  it('accepts a valid calendar, given as JSON text or as an object, and stores it', async () => {
    const asText = await patch({ study_calendar: '{"wed":"module"}' });
    expect(asText.status).toBe(200);
    expect(JSON.parse(asText.body['study_calendar'])).toEqual({ wed: 'module' });

    const asObject = await patch({ study_calendar: { sun: 'module', review_only_note: 'Descanso' } });
    expect(asObject.status).toBe(200);
    expect(JSON.parse(asObject.body['study_calendar'])).toEqual({ sun: 'module', review_only_note: 'Descanso' });
  });
});
