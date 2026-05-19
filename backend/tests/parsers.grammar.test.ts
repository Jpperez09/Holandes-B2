import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGrammarRegistry } from '../src/parsers/grammar';
import { resolveVaultPath } from './fixtures/vaultPath';

const registryPath = () =>
  path.join(
    resolveVaultPath(),
    '05_Exercises',
    'Generated',
    'Grammar_Patterns_A0_A1.md',
  );

describe('parseGrammarRegistry', () => {
  it('parses the A0/A1 registry into 18 patterns', async () => {
    const source = await fs.readFile(registryPath(), 'utf8');
    const result = parseGrammarRegistry({ source, vault_path: registryPath() });
    expect(result.ok).toBe(true);
    const value = result.value!;
    expect(value.type).toBe('grammar-pattern-registry');
    expect(value.cefr_band).toBe('A0-A1');
    expect(value.patterns.length).toBeGreaterThanOrEqual(6);
    // Spot-check a known pattern.
    const v2 = value.patterns.find((p) => p.slug === 'v2-main-clause');
    expect(v2).toBeDefined();
    expect(v2!.pienemann_stage).not.toBeNull();
    expect(v2!.examples.length).toBeGreaterThan(0);
    expect(v2!.module_introduced).toMatch(/^MOD-\d{3}$/);
    expect(v2!.srs_cloze_candidate).toBe(true);
  });

  it('captures all slugs uniquely', async () => {
    const source = await fs.readFile(registryPath(), 'utf8');
    const result = parseGrammarRegistry({ source, vault_path: registryPath() });
    expect(result.ok).toBe(true);
    const slugs = result.value!.patterns.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });
});
