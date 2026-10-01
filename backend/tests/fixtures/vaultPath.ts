import { existsSync } from 'node:fs';
import path from 'node:path';

// The curriculum bundled in this repo — the single source of truth, so a clean
// clone runs the whole suite with no environment variables.
const REPO_CURRICULUM = path.resolve(__dirname, '../../../curriculum');

const CANDIDATE_PATHS = [
  process.env.VAULT_PATH,
  REPO_CURRICULUM,
  // Legacy location of the external vault on Juanpa's machine.
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
