import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  getAllSettings,
  updateSettings,
} from '../services/settings-service';
import { runFullIndex } from '../services/vault-indexer';
import { logger } from '../config/logger';

const router = Router();

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
  res.json(getAllSettings());
});

async function handleUpdateSettings(req: Request, res: Response): Promise<void> {
  const updates = req.body as Record<string, unknown>;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Body must be a JSON object of key-value string pairs.',
    });
    return;
  }

  // Coerce all values to strings
  const stringUpdates: Record<string, string> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) continue;
    stringUpdates[key] = String(value);
  }

  // Validate daily_goal_minutes
  if ('daily_goal_minutes' in stringUpdates) {
    const minutes = parseInt(stringUpdates['daily_goal_minutes'], 10);
    if (isNaN(minutes) || minutes < 15 || minutes > 180) {
      res.status(422).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc7807',
        title: 'Validation Error',
        status: 422,
        detail: 'daily_goal_minutes must be between 15 and 180.',
      });
      return;
    }
  }

  // Validate target_level
  if ('target_level' in stringUpdates) {
    const level = parseInt(stringUpdates['target_level'], 10);
    if (isNaN(level) || level < 1 || level > 100) {
      res.status(422).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc7807',
        title: 'Validation Error',
        status: 422,
        detail: 'target_level must be between 1 and 100.',
      });
      return;
    }
  }

  // Validate vault_path
  if ('vault_path' in stringUpdates) {
    const vaultPath = stringUpdates['vault_path'].trim().replace(/[/\\]+$/, '');
    stringUpdates['vault_path'] = vaultPath;

    if (vaultPath && !fs.existsSync(vaultPath)) {
      res.status(422).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc7807',
        title: 'Validation Error',
        status: 422,
        detail: `Vault path does not exist on disk: ${vaultPath}`,
      });
      return;
    }

    if (vaultPath && !fs.existsSync(path.join(vaultPath, '03_Curriculum'))) {
      res.status(422).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc7807',
        title: 'Validation Error',
        status: 422,
        detail: `Path does not look like a valid vault (missing 03_Curriculum/): ${vaultPath}`,
      });
      return;
    }
  }

  if (Object.keys(stringUpdates).length === 0) {
    res.status(204).end();
    return;
  }

  updateSettings(stringUpdates);

  if ('vault_path' in stringUpdates && stringUpdates['vault_path']) {
    const newPath = stringUpdates['vault_path'];
    logger.info({ vaultPath: newPath }, 'Vault path updated — triggering reindex (with watcher)');
    void runFullIndex(newPath, { watch: true }).catch((err) => {
      logger.error({ err: (err as Error).message }, 'Reindex after settings change failed');
    });
  }

  res.json(getAllSettings());
}

// PATCH /api/settings
router.patch('/', (req: Request, res: Response) => {
  void handleUpdateSettings(req, res);
});

// PUT /api/settings — same semantics as PATCH
router.put('/', (req: Request, res: Response) => {
  void handleUpdateSettings(req, res);
});

export default router;
