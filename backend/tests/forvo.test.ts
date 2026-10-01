import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { forvoUrl } from '../src/services/forvo';
import { resolveVaultPath } from './fixtures/vaultPath';

describe('forvoUrl', () => {
  it('builds https://forvo.com/word/<word>/#nl for a single word', () => {
    expect(forvoUrl('hallo')).toBe('https://forvo.com/word/hallo/#nl');
  });

  it('lowercases the word (Forvo slugs are lowercase)', () => {
    expect(forvoUrl('Nederland')).toBe('https://forvo.com/word/nederland/#nl');
  });

  it('percent-encodes accented letters', () => {
    expect(forvoUrl('één')).toBe('https://forvo.com/word/%C3%A9%C3%A9n/#nl');
    expect(forvoUrl('café')).toBe('https://forvo.com/word/caf%C3%A9/#nl');
  });

  it("keeps an apostrophe or hyphen inside a word ('s avonds, zo'n, Zuid-Holland)", () => {
    expect(forvoUrl("zo'n")).toBe("https://forvo.com/word/zo'n/#nl");
    expect(forvoUrl('Zuid-Holland')).toBe('https://forvo.com/word/zuid-holland/#nl');
  });

  it('gives no link for phrases', () => {
    expect(forvoUrl('dank je wel')).toBeNull();
    expect(forvoUrl('tot ziens', 'phrase')).toBeNull();
    expect(forvoUrl('hoe gaat het')).toBeNull();
  });

  it('gives no link when pos says phrase, even for one token', () => {
    expect(forvoUrl('dag', 'phrase')).toBeNull();
  });

  it('refuses anything that could break out of the URL path', () => {
    expect(forvoUrl('a/b')).toBeNull();
    expect(forvoUrl('x?y')).toBeNull();
    expect(forvoUrl('')).toBeNull();
  });
});

describe('the vocabulary index stores the link in its own column', () => {
  let tmpDir: string;
  let db: Database.Database;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-forvo-'));
    db = new Database(path.join(tmpDir, 'progress.sqlite'));
    db.pragma('foreign_keys = ON');
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
    if (existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const row = (lemma: string) =>
    db
      .prepare('SELECT lemma, pos, forvo_url, audio_url FROM vocabulary_items WHERE lemma = ?')
      .get(lemma) as { lemma: string; pos: string; forvo_url: string | null; audio_url: string | null };

  it('gives single words a link and leaves audio_url alone', () => {
    const hallo = row('hallo');
    expect(hallo.forvo_url).toBe('https://forvo.com/word/hallo/#nl');
    expect(hallo.audio_url).toBeNull();
  });

  it('gives phrases no link', () => {
    for (const phrase of ['tot ziens', 'dank je wel', 'dank u wel']) {
      expect(row(phrase).forvo_url, phrase).toBeNull();
    }
  });

  it('links every single-word item and no multi-word one', () => {
    const rows = db
      .prepare('SELECT lemma, pos, forvo_url FROM vocabulary_items')
      .all() as { lemma: string; pos: string; forvo_url: string | null }[];
    for (const r of rows) {
      const isPhrase = r.pos === 'phrase' || /\s/.test(r.lemma);
      if (isPhrase) expect(r.forvo_url, r.lemma).toBeNull();
      else expect(r.forvo_url, r.lemma).toMatch(/^https:\/\/forvo\.com\/word\/[^/\s]+\/#nl$/);
    }
  });

  it('never writes a Forvo link into audio_url', () => {
    const bad = db
      .prepare(`SELECT lemma FROM vocabulary_items WHERE audio_url LIKE '%forvo%'`)
      .all();
    expect(bad).toEqual([]);
  });
});
