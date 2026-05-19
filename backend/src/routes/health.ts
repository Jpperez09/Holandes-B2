import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { getAppliedMigrations } from '../db/migrator';
import type { HealthResponse, DbHealthResponse } from '../types';

const router = Router();

// GET /api/health
router.get('/', (_req: Request, res: Response) => {
  const body: HealthResponse = { ok: true, ts: new Date().toISOString() };
  res.json(body);
});

// GET /api/health/db
router.get('/db', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const integrityRow = db.pragma('integrity_check', { simple: true }) as string;
    const migrations = getAppliedMigrations(db);

    const body: DbHealthResponse = {
      ok: integrityRow === 'ok',
      migrations,
      integrity: integrityRow,
    };
    res.json(body);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Database health check failed',
      status: 500,
      detail,
    });
  }
});

export default router;
