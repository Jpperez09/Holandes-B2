import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { requireVault } from '../middleware/require-vault';
import { scheduleReview, cardToJson, jsonToCard, initializeCard } from '../services/srs-fsrs';
import { logger } from '../config/logger';

const router = Router();

// GET /api/vocabulary — list (paginated, default 100/page)
router.get('/', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const limit = Math.min(parseInt(String(req.query['limit'] ?? '100'), 10) || 100, 500);
  const offset = Math.max(parseInt(String(req.query['offset'] ?? '0'), 10) || 0, 0);
  const moduleId = req.query['module_id'];
  const where = moduleId ? 'WHERE module_id = ?' : '';
  const params: unknown[] = moduleId ? [String(moduleId)] : [];
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM vocabulary_items ${where}`).get(...params) as {
    cnt: number;
  }).cnt;
  const items = db
    .prepare(
      `SELECT * FROM vocabulary_items ${where}
        ORDER BY id LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);
  res.json({ items, total, limit, offset });
});

// GET /api/vocabulary/due
router.get('/due', requireVault, (_req: Request, res: Response) => {
  const db = getDb();
  // v_due_cards filters by FSRS due timestamp. Brand-new cards (`fsrs_state` NULL)
  // are due immediately; the view doesn't include them, so union with status='new'.
  const cards = db
    .prepare(
      `SELECT * FROM v_due_cards
       UNION ALL
       SELECT * FROM vocabulary_items
        WHERE status = 'new' AND fsrs_state IS NULL
       LIMIT 50`,
    )
    .all();
  res.json(cards);
});

// GET /api/vocabulary/stats
router.get('/stats', requireVault, (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as count FROM vocabulary_items GROUP BY status`
    )
    .all() as { status: string; count: number }[];

  const stats: Record<string, number> = {
    new: 0,
    learning: 0,
    review: 0,
    mature: 0,
    suspended: 0,
    archived: 0,
  };
  for (const row of rows) {
    stats[row.status] = row.count;
  }

  const dueRow = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM v_due_cards`
    )
    .get() as { cnt: number };

  res.json({ ...stats, due: dueRow.cnt });
});

// GET /api/vocabulary/:id
router.get('/:id', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const id = parseInt(req.params['id'], 10);

  if (isNaN(id)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Vocabulary id must be a number.',
    });
  }

  const item = db.prepare('SELECT * FROM vocabulary_items WHERE id = ?').get(id);
  if (!item) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Vocabulary item not found: ${id}`,
    });
  }

  res.json(item);
});

// POST /api/vocabulary/:id/review
router.post('/:id/review', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const id = parseInt(req.params['id'], 10);

  if (isNaN(id)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Vocabulary id must be a number.',
    });
  }

  const { grade, elapsed_seconds = null } = req.body as {
    grade: number;
    elapsed_seconds?: number | null;
  };

  if (!grade || grade < 1 || grade > 4) {
    return res.status(422).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Validation Error',
      status: 422,
      detail: 'grade must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).',
    });
  }

  const item = db.prepare('SELECT * FROM vocabulary_items WHERE id = ?').get(id) as {
    id: number;
    fsrs_state: string | null;
    status: string;
  } | undefined;

  if (!item) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Vocabulary item not found: ${id}`,
    });
  }

  const prevCard = item.fsrs_state ? jsonToCard(item.fsrs_state) : initializeCard();
  const prevStateJson = cardToJson(prevCard);

  let nextCard;
  try {
    const result = scheduleReview(prevCard, grade as 1 | 2 | 3 | 4);
    nextCard = result.card;
  } catch (err) {
    logger.error({ err, id, grade }, 'FSRS scheduling error');
    return res.status(500).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to schedule review.',
    });
  }

  const nextStateJson = cardToJson(nextCard);

  // Map ts-fsrs card state to our status enum
  const stateMap: Record<number, string> = { 0: 'new', 1: 'learning', 2: 'review', 3: 'mature' };
  const newStatus = stateMap[nextCard.state] ?? 'review';

  const updated = db.transaction(() => {
    db.prepare(
      `INSERT INTO vocabulary_reviews (vocabulary_id, reviewed_at, grade, prev_state, next_state, elapsed_seconds)
       VALUES (?, datetime('now'), ?, ?, ?, ?)`
    ).run(id, grade, prevStateJson, nextStateJson, elapsed_seconds);

    db.prepare(
      `UPDATE vocabulary_items
       SET fsrs_state = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextStateJson, newStatus, id);

    return db.prepare('SELECT * FROM vocabulary_items WHERE id = ?').get(id);
  })();

  res.json({ item: updated, nextDue: nextCard.due });
});

export default router;
