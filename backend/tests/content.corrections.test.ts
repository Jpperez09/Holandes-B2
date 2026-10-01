import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RESOURCES } from '../../frontend/src/data/resources';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';
import { dialogueBlocks, spokenText } from './helpers/dialogueVocab';

// docs/SPEC_2026-10_v2.md, P6: content corrections. Each one is pinned here so it
// cannot come back unnoticed.

let reader: VaultReader;
let vault: string;

beforeAll(async () => {
  vault = resolveVaultPath();
  reader = new VaultReader({ vault_path: vault, watch: false });
  await reader.start();
});

afterAll(async () => {
  await reader.stop();
});

const modules = () => reader.snapshot().modules;
const read = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const source = (id: string) => read(modules().find((m) => m.module_id === id)!.vault_path);
const lemma = (word: string) => reader.vocabularyItems().find((i) => i.lemma === word)!;

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? markdownFiles(full) : full.endsWith('.md') ? [full] : [];
  });
}

describe('vocabulary_count in the frontmatter matches the rows of the seed', () => {
  it('for every module (reviews have none)', () => {
    const rows = new Map<string, number>();
    for (const item of reader.vocabularyItems()) rows.set(item.module_id ?? '?', (rows.get(item.module_id ?? '?') ?? 0) + 1);
    const mismatches = modules()
      .filter((m) => m.vocabulary_count !== (rows.get(m.module_id) ?? 0))
      .map((m) => `${m.module_id}: frontmatter ${m.vocabulary_count}, seed ${rows.get(m.module_id) ?? 0}`);
    expect(mismatches).toEqual([]);
  });

  it('MOD-003, MOD-004 and MOD-005 say what the seed holds (32, 39, 24)', () => {
    const count = (id: string) => modules().find((m) => m.module_id === id)!.vocabulary_count;
    expect([count('MOD-003'), count('MOD-004'), count('MOD-005')]).toEqual([32, 39, 24]);
  });

  it('every seed row belongs to a module that exists', () => {
    const ids = new Set(modules().map((m) => m.module_id));
    const orphans = reader.vocabularyItems().filter((i) => !ids.has(i.module_id ?? '?')).map((i) => i.lemma);
    expect(orphans).toEqual([]);
  });
});

describe('after reindexing, only the Colombia warning is left', () => {
  it('has exactly one warning: Colombia has no article, and that is accepted', () => {
    const warnings = reader.snapshot().warnings;
    expect(warnings.map((w) => w.message)).toEqual([expect.stringContaining('Colombia')]);
    expect(warnings[0].code).toBe('noun-missing-article');
  });
});

describe('pronunciation and examples', () => {
  it('dinsdag is /ˈdɪnzdɑx/ with a short i, in the seed and in MOD-008', () => {
    expect(lemma('dinsdag').ipa).toBe('/ˈdɪnzdɑx/');
    expect(source('MOD-008')).toContain('/ˈdɪnzdɑx/');
    const stale = markdownFiles(vault).filter((f) => read(f).includes('ˈdinzdɑx'));
    expect(stale).toEqual([]);
  });

  it('no module or seed keeps the unnatural examples', () => {
    const banned = ['Mijn been is moe', 'Wij praten Nederlands', 'wij praten Nederlands', 'jij Nederlands? (praten)'];
    const hits = markdownFiles(vault).flatMap((f) => banned.filter((b) => read(f).includes(b)).map((b) => `${path.basename(f)}: ${b}`));
    expect(hits).toEqual([]);
  });

  it('the example of been uses the plural, and the example of praten still uses praten', () => {
    expect(lemma('been').example).toBe('Mijn benen zijn moe.');
    expect(lemma('praten').example).toMatch(/\bpraten\b/);
    expect(lemma('praten').example).not.toMatch(/Nederlands/);
  });

  it('suiker and beetje keep their plural form but mark it as rare', () => {
    expect(lemma('suiker').plural).toBe('suikers (rare)');
    expect(lemma('beetje').plural).toBe('beetjes (rare)');
    expect(source('MOD-014')).toContain('| suiker | de | suikers (rare) |');
    expect(source('MOD-015')).toContain('| beetje | het | beetjes (rare) |');
  });
});

describe('MOD-014 dialogue: nobody calls "Ober!"', () => {
  it('asks the waiter with "Pardon, mag ik nog een limonade?"', () => {
    const [block] = dialogueBlocks(source('MOD-014'));
    const spoken = spokenText(block);
    expect(spoken).toContain('Pardon, mag ik nog een limonade?');
    expect(spoken).not.toMatch(/\bOber[,!]/); // the speaker label "Ober:" is not spoken
    expect(source('MOD-014')).toContain('Excuse me, may I have another lemonade?');
    expect(source('MOD-014')).not.toMatch(/Waiter, another lemonade/);
  });

  it('the example sentence of the lemma ober does not call out "Ober," either', () => {
    expect(lemma('ober').example).toBe('De ober komt met de kaart.');
  });
});

describe('the dialogues are played with the button, not pasted into a voice (P2)', () => {
  it('the text above every shadowing block points to the play button and no longer says to paste it', () => {
    const wrong: string[] = [];
    for (const m of modules()) {
      if (!/### 8\.1\./.test(source(m.module_id))) continue; // MOD-001 has no dialogue
      const intro = source(m.module_id).match(/### 8\.1\.[^\n]*\n\n([^\n]+)/)?.[1] ?? '';
      if (!intro.includes('▶') || /Paste the Dutch/.test(intro)) wrong.push(m.module_id);
    }
    expect(wrong).toEqual([]);
  });
});

describe('06_Resources: what the files say about themselves is true', () => {
  const dir = () => path.join(vault, '06_Resources');

  it('the INDEX no longer lists any file as "Placeholder" and says it was replaced by the hub', () => {
    const index = read(path.join(dir(), 'INDEX.md'));
    expect(index).not.toMatch(/\|\s*Placeholder\s*\|/);
    expect(index).toMatch(/^status: replaced$/m);
    expect(index).toContain('Resources screen');
  });

  it('no file in the folder is still marked as a placeholder', () => {
    const stillMarked = readdirSync(dir()).filter((f) => /^status:\s*placeholder\s*$/m.test(read(path.join(dir(), f))));
    expect(stillMarked).toEqual([]);
  });

  it('the research notes label the Belgian (Flemish) sources', () => {
    expect(read(path.join(dir(), 'Courses.md'))).toMatch(/NedBox[^\n]*Belgian \(Flemish\)/);
    expect(read(path.join(dir(), 'B2_Exam_Resources.md'))).toMatch(/Wablieft[^\n]*Belgian \/ Flemish/);
  });
});

describe('the Resources hub of the app', () => {
  it('has 23 distinct resources, each with an https link', () => {
    expect(RESOURCES).toHaveLength(23);
    expect(new Set(RESOURCES.map((r) => r.id)).size).toBe(RESOURCES.length);
    for (const r of RESOURCES) expect(r.url, r.id).toMatch(/^https:\/\/[^\s]+$/);
  });

  it('labels nedbox.be and wablieft.be as Belgian (Flemish) sources, and only the .be ones', () => {
    const flemish = RESOURCES.filter((r) => r.region === 'flemish').map((r) => r.url);
    expect(flemish.sort()).toEqual(['https://www.nedbox.be', 'https://www.wablieft.be']);
    const beLinks = RESOURCES.filter((r) => new URL(r.url).hostname.endsWith('.be')).map((r) => r.url);
    expect(beLinks.sort()).toEqual(flemish);
  });
});
