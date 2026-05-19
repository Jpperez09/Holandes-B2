import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseVocabularySeed } from '../src/parsers/vocabulary';
import { resolveVaultPath } from './fixtures/vaultPath';

const seedPath = () =>
  path.join(
    resolveVaultPath(),
    '05_Exercises',
    'Generated',
    'Vocabulary_Seed_A0_A1.md',
  );

describe('parseVocabularySeed', () => {
  it('parses 100+ items from the A0/A1 seed', async () => {
    const source = await fs.readFile(seedPath(), 'utf8');
    const result = parseVocabularySeed({ source, vault_path: seedPath() });
    expect(result.ok).toBe(true);
    const value = result.value!;
    expect(value.type).toBe('vocabulary-seed');
    expect(value.cefr_band).toBe('A0-A1');
    expect(value.covers_modules).toContain('MOD-001');
    expect(value.items.length).toBeGreaterThanOrEqual(100);
    // Spot-check a known entry.
    const hallo = value.items.find((it) => it.lemma === 'hallo');
    expect(hallo).toBeDefined();
    expect(hallo!.translation_en).toBe('hello');
    expect(hallo!.module_id).toBe('MOD-001');
    expect(hallo!.tts_text).toBe('hallo');
    // de/het articles present on nouns.
    const huis = value.items.find((it) => it.lemma === 'huis');
    expect(huis!.article).toBe('het');
    const moeder = value.items.find((it) => it.lemma === 'moeder');
    expect(moeder!.article).toBe('de');
  });

  it('preserves a tts_text fallback equal to the lemma when none provided', async () => {
    const source = await fs.readFile(seedPath(), 'utf8');
    const result = parseVocabularySeed({ source, vault_path: seedPath() });
    expect(result.ok).toBe(true);
    for (const item of result.value!.items) {
      expect(item.tts_text.length).toBeGreaterThan(0);
    }
  });

  it('skips a malformed row and continues with siblings', () => {
    const src = `---
type: vocabulary-seed
cefr_band: A0-A1
covers_modules: [MOD-001]
---

## 2.1. Section

| id | dutch | gloss_en | module_id |
|----|-------|----------|-----------|
| voc-A1-001 | hallo | hello | MOD-001 |
|  |  |  |  |
| voc-A1-002 | dag | hi/bye | MOD-001 |
`;
    const result = parseVocabularySeed({ source: src, vault_path: '/virtual/seed.md' });
    expect(result.ok).toBe(true);
    expect(result.value!.items.map((it) => it.lemma)).toEqual(['hallo', 'dag']);
    expect(result.warnings.some((w) => w.code === 'vocab-row-skipped')).toBe(true);
  });
});
