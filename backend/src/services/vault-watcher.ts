import { logger } from '../config/logger';
import { getVaultReader, runFullIndex, stopIndexer } from './vault-indexer';

/**
 * Watcher integration.
 *
 * The Phase 3 Agent 2 `VaultReader` already runs chokidar internally when
 * constructed with `{ watch: true }` and emits `parsed`/`removed` events that
 * the indexer service uses to keep SQLite in sync. This module exposes a thin
 * `startWatcher` / `stopWatcher` API for the rest of the backend so callers
 * don't need to know about the reader internals.
 */

let watching = false;

export async function startWatcher(vaultPath: string): Promise<void> {
  if (!vaultPath || vaultPath.trim() === '') {
    logger.warn('[vault-watcher] vault_path empty — not starting watcher');
    return;
  }

  const reader = getVaultReader();
  if (!reader) {
    // First boot: run the indexer with watch=true so chokidar comes up.
    logger.info({ vaultPath }, '[vault-watcher] bootstrapping VaultReader with watch=true');
    await runFullIndex(vaultPath, { watch: true });
    watching = true;
    return;
  }

  if (watching) {
    logger.debug('[vault-watcher] already watching — restart by reindex');
    return;
  }

  // Reader exists but was started with watch=false. Tear down and reopen with watching enabled.
  await stopIndexer();
  await runFullIndex(vaultPath, { watch: true });
  watching = true;
}

export async function stopWatcher(): Promise<void> {
  if (!watching) return;
  await stopIndexer();
  watching = false;
  logger.info('[vault-watcher] watcher stopped');
}

export function isWatching(): boolean {
  return watching;
}
