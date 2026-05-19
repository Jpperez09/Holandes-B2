import { existsSync } from 'node:fs';
import path from 'node:path';

const CANDIDATE_PATHS = [
  process.env.VAULT_PATH,
  // The real vault on Juanpa's machine.
  'D:/Obsidian/Juanpa-Holandes-B2',
  'D:\\Obsidian\\Juanpa-Holandes-B2',
];

export function resolveVaultPath(): string {
  for (const p of CANDIDATE_PATHS) {
    if (!p) continue;
    if (existsSync(p)) return path.resolve(p);
  }
  throw new Error(
    'Could not locate vault. Set VAULT_PATH env var to the absolute path of the Obsidian vault.',
  );
}
