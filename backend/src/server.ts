import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { logger } from './config/logger';
import { openDb } from './db/connection';
import { runMigrations } from './db/migrator';
import {
  isVaultConfigured,
  getVaultPath,
  getAllSettings,
  updateSettings,
} from './services/settings-service';
import { runFullIndex } from './services/vault-indexer';

// Route modules
import healthRouter from './routes/health';
import settingsRouter from './routes/settings';
import levelsRouter from './routes/levels';
import modulesRouter from './routes/modules';
import activitiesRouter from './routes/activities';
import vocabularyRouter from './routes/vocabulary';
import dailyLogsRouter from './routes/daily-logs';
import progressRouter from './routes/progress';
import vaultRouter from './routes/vault';
import todayRouter from './routes/today';

const app = express();

app.use(express.json());

// All API routes
app.use('/api/health', healthRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/vocabulary', vocabularyRouter);
app.use('/api/daily-logs', dailyLogsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/today', todayRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    type: 'https://datatracker.ietf.org/doc/html/rfc7807',
    title: 'Not Found',
    status: 404,
    detail: 'Route not found.',
  });
});

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error({ err: msg }, 'Unhandled error');
  res.status(500).json({
    type: 'https://datatracker.ietf.org/doc/html/rfc7807',
    title: 'Internal Server Error',
    status: 500,
    detail: msg,
  });
});

async function start(): Promise<void> {
  // 1. Open DB
  const db = openDb();

  // 2. Run migrations
  const applied = runMigrations(db);
  if (applied.length > 0) {
    logger.info({ applied }, 'Migrations applied');
  }

  // 3. Apply vault_path from config file (if DB setting is empty and config has one)
  const settings = getAllSettings();
  if (!settings['vault_path'] && config.vault_path) {
    updateSettings({ vault_path: config.vault_path });
    logger.info({ vault_path: config.vault_path }, 'Vault path seeded from config file');
  }

  // 4. Start vault indexer if vault is configured (with watcher enabled).
  if (isVaultConfigured()) {
    const vaultPath = getVaultPath();
    logger.info({ vaultPath }, 'Starting vault indexer');
    try {
      await runFullIndex(vaultPath, { watch: true });
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Vault indexer failed at startup — server continues without indexed content',
      );
    }
  } else {
    logger.warn('vault_path not set — vault features unavailable until configured in Settings');
  }

  // 5. Start server (127.0.0.1 only — never 0.0.0.0)
  const port = config.ports.backend;
  app.listen(port, '127.0.0.1', () => {
    logger.info({ port }, `Backend listening on http://127.0.0.1:${port}`);
    logger.info('Health: http://127.0.0.1:' + port + '/api/health');
  });
}

start().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to start server');
  process.exit(1);
});

export default app;
