import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { requireVault } from '../middleware/require-vault';

const router = Router();

interface ModuleRow {
  id: number;
  level_id: number;
  slug: string;
  title: string;
  sort_order: number;
  vault_path: string;
  checksum: string;
  estimated_minutes: number | null;
  prerequisites: string | null;
  tags: string | null;
  cefr_band: string | null;
  subtype: string | null;
  status: string | null;
  vocabulary_count: number | null;
  grammar_focus_json: string | null;
  pronunciation_focus_json: string | null;
  source_id: string | null;
  percent_complete?: number;
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

function shapeModule(row: ModuleRow): Record<string, unknown> {
  return {
    id: row.id,
    level_id: row.level_id,
    module_id: row.source_id ?? row.slug,
    slug: row.slug,
    title: row.title,
    sort_order: row.sort_order,
    vault_path: row.vault_path,
    checksum: row.checksum,
    estimated_minutes: row.estimated_minutes,
    cefr_band: row.cefr_band,
    subtype: row.subtype,
    status: row.status,
    vocabulary_count: row.vocabulary_count,
    prerequisites: parseJsonArray(row.prerequisites),
    tags: parseJsonArray(row.tags),
    grammar_focus: parseJsonArray(row.grammar_focus_json),
    pronunciation_focus: parseJsonArray(row.pronunciation_focus_json),
    percent_complete: row.percent_complete ?? 0,
  };
}

// GET /api/modules
router.get('/', requireVault, (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.*, COALESCE(vc.percent_complete, 0.0) AS percent_complete
       FROM modules m
       LEFT JOIN v_module_completion vc ON vc.module_id = m.id
       ORDER BY m.sort_order, m.slug`,
    )
    .all() as ModuleRow[];
  res.json(rows.map(shapeModule));
});

// GET /api/modules/:slug — slug can be MOD-001 (source_id) or the DB slug.
router.get('/:slug', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const slug = req.params['slug'];

  const mod = db
    .prepare(
      `SELECT m.*, COALESCE(vc.percent_complete, 0.0) AS percent_complete
         FROM modules m
         LEFT JOIN v_module_completion vc ON vc.module_id = m.id
        WHERE m.slug = ? OR m.source_id = ?
        LIMIT 1`,
    )
    .get(slug, slug) as ModuleRow | undefined;
  if (!mod) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Module not found: ${slug}`,
    });
  }

  const lessons = db
    .prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order')
    .all(mod.id);

  const activities = db
    .prepare(
      `SELECT a.* FROM activities a
        JOIN lessons l ON l.id = a.lesson_id
       WHERE l.module_id = ?
       ORDER BY l.sort_order, a.sort_order`,
    )
    .all(mod.id);

  const vocabulary = db
    .prepare(
      `SELECT id, lemma, article, pos, ipa, translation_en, translation_es,
              cognate_en, cognate_note, example, audio_path, audio_url, tts_text,
              status, level_code, module_id, source_id, tags
         FROM vocabulary_items
        WHERE module_id = ?
        ORDER BY id`,
    )
    .all(mod.source_id ?? slug);

  res.json({ ...shapeModule(mod), lessons, activities, vocabulary });
});

// GET /api/modules/:slug/progress
router.get('/:slug/progress', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const slug = req.params['slug'];

  const completion = db
    .prepare(
      `SELECT vc.* FROM v_module_completion vc
         JOIN modules m ON m.id = vc.module_id
        WHERE m.slug = ? OR m.source_id = ?
        LIMIT 1`,
    )
    .get(slug, slug);

  if (!completion) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Module progress not found: ${slug}`,
    });
  }

  res.json(completion);
});

export default router;
