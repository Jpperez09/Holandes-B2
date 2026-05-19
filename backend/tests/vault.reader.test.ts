import { describe, expect, it } from 'vitest';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';

describe('VaultReader (live vault, watch=false)', () => {
  it('scans the vault and exposes parsed entries via snapshot()', async () => {
    const reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
    await reader.start();
    const snap = reader.snapshot();
    expect(snap.modules.length).toBeGreaterThanOrEqual(5);
    expect(snap.modules[0].module_id).toBe('MOD-001');
    expect(snap.levels.length).toBeGreaterThanOrEqual(5);
    expect(snap.levels[0].level).toBe(1);
    expect(snap.vocabulary_seeds.length).toBeGreaterThanOrEqual(1);
    expect(snap.grammar_registries.length).toBeGreaterThanOrEqual(1);
    expect(reader.vocabularyItems().length).toBeGreaterThanOrEqual(100);
    expect(reader.grammarPatterns().length).toBeGreaterThanOrEqual(6);
    await reader.stop();
  });

  it('returns no error-level warnings on the live seed content', async () => {
    const reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
    await reader.start();
    const errors = reader.snapshot().warnings.filter((w) => w.severity === 'error');
    expect(errors).toEqual([]);
    await reader.stop();
  });

  it('rejects an invalid vault path', () => {
    expect(() => new VaultReader({ vault_path: 'C:/does/not/exist/__juanpa' })).toThrow();
  });
});
