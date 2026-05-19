import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { requireVault } from '../middleware/require-vault';

const router = Router();

interface LevelRow {
  id: number;
  code: string;
  sort_order: number;
  vault_path: string | null;
  title: string | null;
  cefr_band: string | null;
  status: string | null;
  modules_json: string | null;
  skills_json: string | null;
  tags_json: string | null;
  checksum: string | null;
  created_at: string;
  updated_at: string | null;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function shapeLevel(row: LevelRow, moduleCount?: number): Record<string, unknown> {
  return {
    id: row.id,
    level: Number.isFinite(Number(row.code)) ? Number(row.code) : null,
    code: row.code,
    sort_order: row.sort_order,
    title: row.title,
    cefr_band: row.cefr_band,
    status: row.status,
    modules: parseJsonArray(row.modules_json),
    skills: parseJsonArray(row.skills_json),
    tags: parseJsonArray(row.tags_json),
    vault_path: row.vault_path,
    checksum: row.checksum,
    created_at: row.created_at,
    updated_at: row.updated_at,
    module_count: moduleCount ?? 0,
  };
}

// GET /api/levels
router.get('/', requireVault, (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT l.*, (SELECT COUNT(*) FROM modules WHERE level_id = l.id) AS module_count
         FROM levels l
        ORDER BY l.sort_order, l.code`,
    )
    .all() as Array<LevelRow & { module_count: number }>;
  res.json(rows.map((r) => shapeLevel(r, r.module_count)));
});

// GET /api/levels/:level (matches numeric or string code)
router.get('/:level', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const param = req.params['level'];
  const numeric = parseInt(param, 10);

  const levelRow = db
    .prepare('SELECT * FROM levels WHERE code = ? OR id = ?')
    .get(param, isNaN(numeric) ? -1 : numeric) as LevelRow | undefined;

  if (!levelRow) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Level not found: ${param}`,
    });
  }

  const modules = db
    .prepare(
      `SELECT id, slug, source_id, title, sort_order, cefr_band, status,
              estimated_minutes, vocabulary_count
         FROM modules WHERE level_id = ?
         ORDER BY sort_order`,
    )
    .all(levelRow.id);

  res.json({ ...shapeLevel(levelRow, modules.length), modules });
});

// GET /api/levels/:level/unlock-state
router.get('/:level/unlock-state', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const param = req.params['level'];
  const numeric = parseInt(param, 10);

  const levelRow = db
    .prepare('SELECT * FROM levels WHERE code = ? OR id = ?')
    .get(param, isNaN(numeric) ? -1 : numeric) as LevelRow | undefined;

  if (!levelRow) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Level not found: ${param}`,
    });
  }

  const totalModules = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM modules WHERE level_id = ?')
      .get(levelRow.id) as { cnt: number }
  ).cnt;

  res.json({
    level: shapeLevel(levelRow, totalModules),
    unlocked: true,
    totalModules,
    completedModules: 0,
    percentComplete: 0,
    reason: 'unlock-logic-stub',
  });
});

export default router;
