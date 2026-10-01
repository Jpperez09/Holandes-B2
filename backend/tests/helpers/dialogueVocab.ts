import { readFileSync } from 'node:fs';
import type { VaultReader } from '../../src/vault/reader';

// Checks that the shadowing text in section 8.1 of a module only uses what the
// learner has already met by that module (docs/SPEC_2026-10_v2.md, P0).
//
// A word counts as "seen" at MOD-N when it is
//   1. a lemma, plural or verb form in the vocabulary seed with module <= N,
//   2. in the first column of the section 3 tables of a module <= N, or
//   3. a form that a module's grammar section already teaches (TAUGHT_FORMS), or
//   4. a proper name (NAMES).
// Anything else is reported as an exception.

/** Forms taught in grammar sections, keyed by the module that teaches them. */
export const TAUGHT_FORMS: Record<number, { words: string[]; why: string }> = {
  1: {
    words: ['ben', 'is', 'mijn', 'kom', 'uit', 'leer'],
    why: 'MOD-001 section 4 previews "ik ben ___", "mijn naam is ___", "ik kom uit ___"; its speaking phrases include "Ik leer Nederlands."',
  },
  2: {
    words: ['heet', 'jij', 'hij', 'zij'],
    why: 'MOD-002 section 4.1 (ik-heet) and activity A3 drill "Jij/Hij/Zij heet ___"',
  },
  3: {
    words: ['bent', 'zijn', 'komt', 'komen', 'spreek', 'spreekt', 'dit', 'dat', 'studenten'],
    why: 'MOD-003 section 4 (zijn paradigm, ik-kom-uit, ik-spreek, dit-is-dat-is, "Wij zijn studenten")',
  },
  4: {
    words: ['de', 'heb', 'hebt', 'heeft', 'hebben'],
    why: 'MOD-004 section 4 (de/het articles, hebben paradigm)',
  },
  5: {
    words: ['woon', 'woont', 'werk', 'werkt', 'werken', 'ga', 'gaat', 'doe', 'doet', 'zie', 'ziet', 'ken', 'kent', 'broers'],
    why: 'MOD-005 section 4 (regular present tense: stem + no suffix for ik, so "doe"; question examples such as "Hoeveel broers heb jij?")',
  },
};

/** People and places. Names are not vocabulary. */
export const NAMES = [
  'juan', 'pablo', 'anna', 'sophie', 'carlos', 'pieter', 'maria', 'laura', 'daniel', 'emma',
  'amsterdam', 'bogotá', 'utrecht',
];

const num = (id: string) => parseInt(id.replace('MOD-', ''), 10);
const tokens = (text: string): string[] => (text.toLowerCase().match(/\p{L}+/gu) ?? []);
const source = (m: { vault_path: string }) => readFileSync(m.vault_path, 'utf8').replace(/\r\n/g, '\n');

/** The fenced code blocks of section 8.1, one per dialogue. */
export function dialogueBlocks(markdown: string): string[] {
  const start = markdown.search(/^### 8\.1\.[^\n]*$/m);
  if (start < 0) return [];
  const rest = markdown.slice(start).split('\n').slice(1).join('\n');
  const section = rest.split(/^#{2,3} /m)[0];
  return [...section.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
}

/** Spoken words of a block: speaker labels ("Anna:") removed. */
export function spokenText(block: string): string {
  return block.replace(/^[^:\n]+:\s*/gm, '');
}

export const wordCount = (block: string) => spokenText(block).split(/\s+/).filter(Boolean).length;

/** First-column words of the section 3 vocabulary tables. */
function sectionThreeWords(markdown: string): string[] {
  const section = markdown.split(/^## 3\. Vocabulary$/m)[1]?.split(/^## 4\. /m)[0] ?? '';
  const words: string[] = [];
  for (const line of section.split('\n')) {
    if (!line.startsWith('|') || /^\|[\s-]+\|/.test(line)) continue;
    const first = line.split('|')[1] ?? '';
    if (first.trim().toLowerCase() === 'dutch') continue;
    words.push(...tokens(first));
  }
  return words;
}

export interface DialogueReport {
  module_id: string;
  blocks: number;
  words: number;
  /** Words that are neither vocabulary nor an accepted form or name: must be empty. */
  exceptions: string[];
  /** Accepted because a grammar section teaches the form. */
  taughtForms: string[];
  names: string[];
}

export function checkDialogueVocab(reader: VaultReader, moduleId: string): DialogueReport {
  const snapshot = reader.snapshot();
  const mod = snapshot.modules.find((m) => m.module_id === moduleId);
  if (!mod) throw new Error(`Module ${moduleId} not found`);
  const n = num(moduleId);

  const vocab = new Set<string>();
  for (const item of reader.vocabularyItems()) {
    if (num(item.module_id ?? 'MOD-999') > n) continue;
    for (const field of [item.lemma, item.plural, item.forms]) tokens(field ?? '').forEach((w) => vocab.add(w));
  }
  for (const m of snapshot.modules) {
    if (m.subtype === 'standard' && num(m.module_id) <= n) sectionThreeWords(source(m)).forEach((w) => vocab.add(w));
  }
  const taught = new Set<string>();
  for (const [level, { words }] of Object.entries(TAUGHT_FORMS)) {
    if (Number(level) <= n) words.forEach((w) => taught.add(w));
  }
  const names = new Set(NAMES);

  const blocks = dialogueBlocks(source(mod));
  const exceptions = new Set<string>();
  const usedTaught = new Set<string>();
  const usedNames = new Set<string>();
  for (const block of blocks) {
    for (const word of tokens(spokenText(block))) {
      if (vocab.has(word)) continue;
      if (taught.has(word)) usedTaught.add(word);
      else if (names.has(word)) usedNames.add(word);
      else exceptions.add(word);
    }
  }
  return {
    module_id: moduleId,
    blocks: blocks.length,
    words: blocks.reduce((total, b) => total + wordCount(b), 0),
    exceptions: [...exceptions].sort(),
    taughtForms: [...usedTaught].sort(),
    names: [...usedNames].sort(),
  };
}
