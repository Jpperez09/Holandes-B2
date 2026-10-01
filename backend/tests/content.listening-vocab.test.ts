import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';
import { checkDialogueVocab } from './helpers/dialogueVocab';

// docs/SPEC_2026-10_v2.md, P0: MOD-002..005 carry their own written listening
// material in section 8.1, built only from what the learner has met so far.

let reader: VaultReader;

beforeAll(async () => {
  reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
  await reader.start();
});

afterAll(async () => {
  await reader.stop();
});

const source = (id: string) => {
  const m = reader.snapshot().modules.find((x) => x.module_id === id)!;
  return readFileSync(m.vault_path, 'utf8').replace(/\r\n/g, '\n');
};

// MOD-002 is one introduction monologue (~60 s); MOD-003..005 are 2-3 short
// dialogues that add up to 60-90 s at a slow pace.
const EXPECTED: Record<string, { blocks: [number, number]; words: [number, number] }> = {
  'MOD-002': { blocks: [1, 1], words: [85, 140] },
  'MOD-003': { blocks: [2, 3], words: [120, 220] },
  'MOD-004': { blocks: [2, 3], words: [120, 220] },
  'MOD-005': { blocks: [2, 3], words: [120, 220] },
};

describe.each(Object.entries(EXPECTED))('%s listening material (section 8.1)', (id, expected) => {
  it('has the right number of blocks and a 60-90 s amount of text', () => {
    const r = checkDialogueVocab(reader, id);
    expect(r.blocks, `${id} blocks`).toBeGreaterThanOrEqual(expected.blocks[0]);
    expect(r.blocks, `${id} blocks`).toBeLessThanOrEqual(expected.blocks[1]);
    expect(r.words, `${id} words`).toBeGreaterThanOrEqual(expected.words[0]);
    expect(r.words, `${id} words`).toBeLessThanOrEqual(expected.words[1]);
  });

  it('only uses vocabulary and grammar met up to this module', () => {
    expect(checkDialogueVocab(reader, id).exceptions).toEqual([]);
  });

  it('has an English translation (8.2), and its listening activity points to section 8.1', () => {
    const text = source(id);
    expect(text).toMatch(/### 8\.2\./);
    const activities = text.split('\n## 6. Activities\n')[1]?.split('\n---\n')[0] ?? '';
    const listening = activities.split('\n').filter((l) => /^\| A\d+ \| listening \|/.test(l));
    expect(listening.some((l) => l.includes('§8.1')), `${id} activities`).toBe(true);
  });
});
