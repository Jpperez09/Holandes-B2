import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';

// Content rules for the bundled curriculum. They pin the 2.4 corrections and
// keep every later vocabulary seed honest: nouns carry de/het, language names
// are neuter, examples belong to their own lemma.

let reader: VaultReader;

beforeAll(async () => {
  reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
  await reader.start();
});

afterAll(async () => {
  await reader.stop();
});

const item = (lemma: string) => {
  const found = reader.vocabularyItems().find((i) => i.lemma === lemma);
  if (!found) throw new Error(`lemma not in seed: ${lemma}`);
  return found;
};

describe('vocabulary content invariants', () => {
  it('every common noun has a de/het article (proper nouns are exempt)', () => {
    const missing = reader
      .vocabularyItems()
      .filter((i) => i.pos.startsWith('noun') && i.pos !== 'noun-proper' && !i.article)
      .map((i) => i.lemma);
    expect(missing).toEqual([]);
  });

  it('mevrouw and meneer take de', () => {
    expect(item('mevrouw').article).toBe('de');
    expect(item('meneer').article).toBe('de');
  });

  it('language names are neuter: het Nederlands, Engels, Spaans, Portugees', () => {
    for (const language of ['Nederlands', 'Engels', 'Spaans', 'Portugees']) {
      expect(item(language).article, language).toBe('het');
    }
  });

  it('Portugees has a long vowel in its IPA', () => {
    expect(item('Portugees').ipa).toBe('/pɔrtyˈɣeːs/');
  });

  it('only the proper noun Colombia lacks an article, as an info-level note', () => {
    const noArticle = reader
      .snapshot()
      .warnings.filter((w) => w.code === 'noun-missing-article')
      .map((w) => ({ severity: w.severity, lemma: (w.context as { lemma?: string } | undefined)?.lemma }));
    expect(noArticle).toEqual([{ severity: 'info', lemma: 'Colombia' }]);
  });

  it('Nederland (the country) has its own example, not the one for Nederlands', () => {
    const example = item('Nederland').example ?? '';
    expect(example).toContain('Nederland');
    expect(example).not.toMatch(/Nederlands/);
    expect(example).not.toMatch(/Nederland\(s\)/);
  });
});
