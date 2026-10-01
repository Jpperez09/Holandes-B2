import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';

// Rules for the October 2026 content (docs/SPEC_2026-10.md, Phase 3).
// They are written against whatever modules exist, so they hold at every
// commit while the 18 new modules arrive one by one.
//
//  - standard modules: MOD-001..MOD-099, one per level, chained by prerequisites
//  - weekly reviews:   MOD-101..MOD-199, subtype "review", no new vocabulary
//  - new vocabulary:   12-15 lemmas per standard module, 180 in total at most
//    (31 days x 10 new cards a day = 310, minus the 130 that already exist)

const FIRST_NEW_STANDARD = 6;
const MAX_NEW_LEMMAS = 180;

let reader: VaultReader;

beforeAll(async () => {
  reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
  await reader.start();
});

afterAll(async () => {
  await reader.stop();
});

const modules = () => reader.snapshot().modules;
const num = (id: string) => parseInt(id.replace('MOD-', ''), 10);
const standards = () => modules().filter((m) => m.subtype === 'standard');
const newStandards = () => standards().filter((m) => num(m.module_id) >= FIRST_NEW_STANDARD);
const reviews = () => modules().filter((m) => m.subtype === 'review');
const sumMinutes = (m: { activities: { estimated_minutes: number | null }[] }) =>
  m.activities.reduce((total, a) => total + (a.estimated_minutes ?? 0), 0);
const source = (m: { vault_path: string }) => readFileSync(m.vault_path, 'utf8').replace(/\r\n/g, '\n');

describe('the whole curriculum', () => {
  it('has no warnings above info level', () => {
    const noisy = reader
      .snapshot()
      .warnings.filter((w) => w.severity !== 'info')
      .map((w) => `${w.severity} ${w.code} ${w.vault_path ?? ''}: ${w.message}`);
    expect(noisy).toEqual([]);
  });

  it('has unique module ids and every module id parses as MOD-NNN', () => {
    const ids = modules().map((m) => m.module_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^MOD-\d{3,}$/);
  });

  it('keeps vocabulary lemmas unique across all seed files (a duplicate would overwrite the first)', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const item of reader.vocabularyItems()) {
      const key = item.lemma.toLowerCase();
      if (seen.has(key)) clashes.push(`${item.lemma} (${seen.get(key)} / ${item.module_id})`);
      seen.set(key, item.module_id ?? '?');
    }
    expect(clashes).toEqual([]);
  });

  it('adds at most 180 new lemmas on top of the original 130', () => {
    const added = reader.vocabularyItems().filter((i) => num(i.module_id ?? 'MOD-000') >= FIRST_NEW_STANDARD);
    expect(added.length).toBeLessThanOrEqual(MAX_NEW_LEMMAS);
  });
});

describe('standard modules from MOD-006', () => {
  it('are numbered without gaps and chained by prerequisites', () => {
    const list = newStandards().sort((a, b) => num(a.module_id) - num(b.module_id));
    list.forEach((m, i) => {
      const n = FIRST_NEW_STANDARD + i;
      expect(m.module_id).toBe(`MOD-${String(n).padStart(3, '0')}`);
      expect(m.level, m.module_id).toBe(n);
      expect(m.prerequisites, m.module_id).toEqual([`MOD-${String(n - 1).padStart(3, '0')}`]);
    });
  });

  it('take about 30 minutes: frontmatter and activities agree', () => {
    for (const m of newStandards()) {
      expect(m.estimated_minutes, m.module_id).toBe(30);
      expect(sumMinutes(m), `${m.module_id} activities`).toBe(30);
    }
  });

  it('introduce 12-15 lemmas, as many as the module says, all from the seed', () => {
    for (const m of newStandards()) {
      const lemmas = reader.vocabularyItems().filter((i) => i.module_id === m.module_id);
      expect(lemmas.length, m.module_id).toBeGreaterThanOrEqual(12);
      expect(lemmas.length, m.module_id).toBeLessThanOrEqual(15);
      expect(m.vocabulary_count, m.module_id).toBe(lemmas.length);
    }
  });

  it('include a written dialogue for shadowing (60-90 s) in section 8.1', () => {
    for (const m of newStandards()) {
      const block = source(m).match(/### 8\.1\.[^\n]*\n[\s\S]*?```\n([\s\S]*?)```/);
      expect(block, `${m.module_id} has no 8.1 code block`).not.toBeNull();
      const words = block![1].replace(/^[^:\n]+:\s*/gm, '').split(/\s+/).filter(Boolean).length;
      expect(words, `${m.module_id} dialogue words`).toBeGreaterThanOrEqual(100);
      expect(words, `${m.module_id} dialogue words`).toBeLessThanOrEqual(220);
    }
  });

  it('end with a real-world task', () => {
    for (const m of newStandards()) {
      expect(source(m), m.module_id).toMatch(/## 11\. Mini Real-World Task/);
    }
  });
});

describe('weekly review modules', () => {
  it('use ids MOD-101.. and subtype review, so they never need the standard numbering', () => {
    for (const m of reviews()) {
      expect(num(m.module_id), m.module_id).toBeGreaterThanOrEqual(101);
      expect(num(m.module_id), m.module_id).toBeLessThan(200);
    }
    for (const m of modules().filter((x) => num(x.module_id) >= 101)) {
      expect(m.subtype, m.module_id).toBe('review');
    }
  });

  it('bring no new vocabulary and take about 30 minutes', () => {
    for (const m of reviews()) {
      expect(m.vocabulary_count, m.module_id).toBe(0);
      expect(reader.vocabularyItems().filter((i) => i.module_id === m.module_id), m.module_id).toEqual([]);
      expect(m.estimated_minutes, m.module_id).toBe(30);
      expect(sumMinutes(m), `${m.module_id} activities`).toBe(30);
    }
  });

  it('sit on the level of the last standard module they cover (level must stay within 1-100)', () => {
    for (const m of reviews()) {
      expect(m.level, m.module_id).toBeGreaterThanOrEqual(1);
      expect(m.level, m.module_id).toBeLessThanOrEqual(100);
      expect(standards().some((s) => s.level === m.level), m.module_id).toBe(true);
    }
  });

  it('carry a 20-item quiz with an answer key, a recorded oral task and a written task', () => {
    for (const m of reviews()) {
      const text = source(m);
      const key = text.split('### Answer key')[1]?.split('\n---')[0] ?? '';
      const rows = key.split('\n').filter((l) => /^\| \d+ \|/.test(l));
      expect(rows.length, `${m.module_id} answer key`).toBe(20);
      expect(text, m.module_id).toMatch(/### 9\.1\. Recorded production/);
      expect(text, m.module_id).toMatch(/## 10\. Writing Practice/);
    }
  });

  it('have an oral and a written production among their activities', () => {
    for (const m of reviews()) {
      const types = m.activities.map((a) => a.type);
      expect(types, m.module_id).toContain('speaking');
      expect(types, m.module_id).toContain('writing');
    }
  });
});
