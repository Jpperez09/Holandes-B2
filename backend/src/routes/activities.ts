import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { requireVault } from '../middleware/require-vault';

const router = Router();

// GET /api/activities/:id
router.get('/:id', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const id = parseInt(req.params['id'], 10);

  if (isNaN(id)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Activity id must be a number.',
    });
  }

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!activity) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Activity not found: ${id}`,
    });
  }

  res.json(activity);
});

// POST /api/activities/:id/attempts
router.post('/:id/attempts', requireVault, (req: Request, res: Response) => {
  const db = getDb();
  const activityId = parseInt(req.params['id'], 10);

  if (isNaN(activityId)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Activity id must be a number.',
    });
  }

  const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(activityId);
  if (!activity) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `Activity not found: ${activityId}`,
    });
  }

  const {
    session_id = null,
    started_at,
    completed_at,
    duration_seconds = null,
    score = null,
    self_rating = null,
    payload_json = null,
  } = req.body as {
    session_id?: number | null;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number | null;
    score?: number | null;
    self_rating?: number | null;
    payload_json?: string | null;
  };

  if (self_rating !== null && (self_rating < 1 || self_rating > 5)) {
    return res.status(422).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Validation Error',
      status: 422,
      detail: 'self_rating must be between 1 and 5.',
    });
  }

  const now = new Date().toISOString();

  const attempt = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO activity_attempts
         (user_id, activity_id, session_id, started_at, completed_at, duration_seconds, score, self_rating, payload_json)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        activityId,
        session_id,
        started_at ?? now,
        completed_at ?? now,
        duration_seconds,
        score,
        self_rating,
        payload_json ? String(payload_json) : null
      );
    return db.prepare('SELECT * FROM activity_attempts WHERE id = ?').get(result.lastInsertRowid);
  })();

  res.status(201).json(attempt);
});

export default router;
