import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runMigrations } from '../src/db/migrator';
import { parseVocabularySeed } from '../src/parsers/vocabulary';

// The seed may carry two optional columns: `plural` (nouns) and `forms` (verbs).

const SEED = `---
type: vocabulary-seed
cefr_band: A0-A1
covers_modules: [MOD-006]
---

# Test seed

## 2. Items

### 2.1. Sample (MOD-006)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|----|-------|---------|-----|--------|-------|-----|----------|----------|------------|------------|-----------|
| voc-A1-900 | fiets | de | noun | fietsen | — | /fits/ | bicycle | bicicleta | false | *Ik heb geen fiets.* | MOD-006 |
| voc-A1-901 | begrijpen | — | verb | — | ik begrijp, hij begrijpt · begreep · begrepen | /bəˈɣrɛipə(n)/ | to understand | entender | false | *Ik begrijp het niet.* | MOD-006 |
| voc-A1-902 | nooit | — | adv | — | — | /nojt/ | never | nunca | false | *Ik drink nooit bier.* | MOD-006 |
`;

describe('parseVocabularySeed: plural and forms columns', () => {
  const parsed = parseVocabularySeed({ source: SEED, vault_path: 'test-seed.md' });
  const item = (lemma: string) => parsed.value!.items.find((i) => i.lemma === lemma)!;

  it('reads the plural of a noun', () => {
    expect(item('fiets').plural).toBe('fietsen');
    expect(item('fiets').forms).toBeNull();
  });

  it('reads the forms of a verb', () => {
    expect(item('begrijpen').forms).toBe('ik begrijp, hij begrijpt · begreep · begrepen');
    expect(item('begrijpen').plural).toBeNull();
  });

  it('leaves both empty for words that have none', () => {
    expect(item('nooit').plural).toBeNull();
    expect(item('nooit').forms).toBeNull();
  });

  it('still parses a seed without the two columns (the original A0/A1 seed has none)', () => {
    const legacy = `---
type: vocabulary-seed
cefr_band: A0-A1
covers_modules: [MOD-001]
---

## 2. Items

### 2.1. Greetings (MOD-001)

| id | dutch | article | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|-----------|
| voc-A1-001 | hallo | — | int | /haˈloː/ | hello | *Hallo.* | MOD-001 |
`;
    const result = parseVocabularySeed({ source: legacy, vault_path: 'legacy.md' });
    expect(result.value!.items).toHaveLength(1);
    expect(result.value!.items[0].plural).toBeNull();
    expect(result.value!.items[0].forms).toBeNull();
  });
});

describe('the index stores plural and forms', () => {
  let tmpDir: string;
  let db: Database.Database;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-plural-'));
    const vault = path.join(tmpDir, 'vault');
    await fs.mkdir(path.join(vault, '03_Curriculum', 'Modules'), { recursive: true });
    await fs.mkdir(path.join(vault, '03_Curriculum', 'Levels'), { recursive: true });
    await fs.mkdir(path.join(vault, '05_Exercises', 'Generated'), { recursive: true });
    await fs.writeFile(path.join(vault, '05_Exercises', 'Generated', 'Vocabulary_Seed_Test.md'), SEED);

    db = new Database(path.join(tmpDir, 'progress.sqlite'));
    db.pragma('foreign_keys = ON');
    const conn = await import('../src/db/connection');
    conn.setDbForTesting(db);
    runMigrations(db);
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('vault_path', ?)`).run(vault);
    const { runFullIndex } = await import('../src/services/vault-indexer');
    await runFullIndex(vault, { watch: false });
  });

  afterAll(async () => {
    const indexer = await import('../src/services/vault-indexer');
    await indexer.stopIndexer();
    db.close();
    if (existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const row = (lemma: string) =>
    db.prepare('SELECT plural, forms FROM vocabulary_items WHERE lemma = ?').get(lemma) as {
      plural: string | null;
      forms: string | null;
    };

  it('keeps the plural of a noun and the forms of a verb', () => {
    expect(row('fiets')).toEqual({ plural: 'fietsen', forms: null });
    expect(row('begrijpen')).toEqual({
      plural: null,
      forms: 'ik begrijp, hij begrijpt · begreep · begrepen',
    });
  });

  it('leaves other words empty', () => {
    expect(row('nooit')).toEqual({ plural: null, forms: null });
  });
});
