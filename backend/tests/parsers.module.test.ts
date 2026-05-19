import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseModuleFile } from '../src/parsers/module';
import { resolveVaultPath } from './fixtures/vaultPath';

const modulePath = (id: string) =>
  path.join(resolveVaultPath(), '03_Curriculum', 'Modules', `${id}.md`);

const MODULE_IDS = [
  'MOD-001_First_Contact',
  'MOD-002_Dutch_Sounds_and_Greetings',
  'MOD-003_I_Am_You_Are',
  'MOD-004_Nouns_De_Het_and_Core_Objects',
  'MOD-005_Basic_Sentences_and_Questions',
];

describe('parseModuleFile', () => {
  for (const id of MODULE_IDS) {
    it(`parses ${id} successfully`, async () => {
      const source = await fs.readFile(modulePath(id), 'utf8');
      const result = parseModuleFile({ source, vault_path: modulePath(id) });
      expect(result.ok).toBe(true);
      expect(result.value).not.toBeNull();
      const value = result.value!;
      expect(value.type).toBe('module');
      expect(value.module_id).toMatch(/^MOD-\d{3}$/);
      expect(typeof value.level).toBe('number');
      expect(value.cefr_band.length).toBeGreaterThan(0);
      expect(value.topic.length).toBeGreaterThan(0);
      expect(Array.isArray(value.activities)).toBe(true);
      // Every seed module has a §6 Activities table.
      expect(value.activities.length).toBeGreaterThan(0);
      // No error-level warnings on the seed files.
      const errors = result.warnings.filter((w) => w.severity === 'error');
      expect(errors).toEqual([]);
    });
  }

  it('parses MOD-001 activities into 7 rows (A1..A7)', async () => {
    const source = await fs.readFile(modulePath('MOD-001_First_Contact'), 'utf8');
    const result = parseModuleFile({
      source,
      vault_path: modulePath('MOD-001_First_Contact'),
    });
    expect(result.ok).toBe(true);
    const acts = result.value!.activities;
    expect(acts.length).toBe(7);
    expect(acts.map((a) => a.slug)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);
    expect(acts[0].type).toBe('listening');
    expect(acts[0].estimated_minutes).toBe(5);
  });

  it('reports an error and skips when required fields are missing', () => {
    const src = `---\ntype: module\n---\n# broken\n`;
    const result = parseModuleFile({ source: src, vault_path: '/virtual/missing.md' });
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.warnings.some((w) => w.code === 'missing-required-field')).toBe(true);
  });

  it('treats unknown fields as info-level warnings (does not skip)', () => {
    const src = `---
module_id: MOD-999
type: module
level: 99
cefr_band: B2
topic: "Test"
ufo_field: 42
---
## 6. Activities

| # | Type | Activity | Estimated time |
|---|---|---|---|
| A1 | reading | Test activity | 5 min |
`;
    const result = parseModuleFile({ source: src, vault_path: '/virtual/MOD-999.md' });
    expect(result.ok).toBe(true);
    expect(result.value!.module_id).toBe('MOD-999');
    expect(result.warnings.some((w) => w.code === 'unknown-frontmatter-field')).toBe(true);
    expect(result.warnings.some((w) => w.severity === 'error')).toBe(false);
  });

  it('handles invalid YAML frontmatter without crashing', () => {
    const src = `---\nbad: : yaml :\n  - [\n---\n# title\n`;
    const result = parseModuleFile({ source: src, vault_path: '/virtual/broken.md' });
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.code === 'invalid-frontmatter-yaml')).toBe(true);
  });
});
