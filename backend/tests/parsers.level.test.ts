import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseLevelFile } from '../src/parsers/level';
import { resolveVaultPath } from './fixtures/vaultPath';

const levelPath = (n: number) =>
  path.join(
    resolveVaultPath(),
    '03_Curriculum',
    'Levels',
    `Level_${String(n).padStart(3, '0')}.md`,
  );

describe('parseLevelFile', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    it(`parses Level_${String(n).padStart(3, '0')}.md successfully`, async () => {
      const source = await fs.readFile(levelPath(n), 'utf8');
      const result = parseLevelFile({ source, vault_path: levelPath(n) });
      expect(result.ok).toBe(true);
      const value = result.value!;
      expect(value.level).toBe(n);
      expect(value.cefr_band.length).toBeGreaterThan(0);
      expect(value.title.length).toBeGreaterThan(0);
      expect(value.modules.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.severity === 'error')).toBe(false);
    });
  }

  it('rejects a non-level file', () => {
    const src = `---\ntype: module\nlevel: 1\ncefr_band: A0-A1\n---\n`;
    const result = parseLevelFile({ source: src, vault_path: '/virtual/x.md' });
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.code === 'wrong-type-for-parser')).toBe(true);
  });
});
