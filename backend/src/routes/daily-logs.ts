import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { writeDailyLog, readDailyLog } from '../services/dailyLogWriter';
import { getVaultPath, isVaultConfigured } from '../services/settings-service';
import { logger } from '../config/logger';

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/daily-logs
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const logs = db
    .prepare('SELECT * FROM daily_logs ORDER BY log_date DESC LIMIT 30')
    .all();
  res.json(logs);
});

// GET /api/daily-logs/:date
router.get('/:date', async (req: Request, res: Response) => {
  const db = getDb();
  const { date } = req.params;

  if (!DATE_RE.test(date)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Date must be in YYYY-MM-DD format.',
    });
  }

  const log = db.prepare('SELECT * FROM daily_logs WHERE log_date = ?').get(date) as
    | Record<string, unknown>
    | undefined;

  // Surface the markdown contents alongside the DB row if available.
  let markdown: string | null = null;
  let markdown_path: string | null = null;
  if (isVaultConfigured()) {
    try {
      const fileData = await readDailyLog(getVaultPath(), date);
      if (fileData) {
        markdown = fileData.content;
        markdown_path = fileData.markdown_path;
      }
    } catch (err) {
      logger.warn({ err: (err as Error).message, date }, 'Failed to read daily log file');
    }
  }

  if (!log && !markdown) {
    return res.status(404).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Not Found',
      status: 404,
      detail: `No daily log found for: ${date}`,
    });
  }

  res.json({ ...(log ?? { log_date: date }), markdown, markdown_path });
});

// PUT /api/daily-logs/:date
router.put('/:date', async (req: Request, res: Response) => {
  const db = getDb();
  const { date } = req.params;

  if (!DATE_RE.test(date)) {
    return res.status(400).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Bad Request',
      status: 400,
      detail: 'Date must be in YYYY-MM-DD format.',
    });
  }

  const {
    notes = '',
    minutes = 0,
    auto_summary = '',
    mood = null,
  } = req.body as {
    notes?: string;
    minutes?: number;
    auto_summary?: string;
    mood?: string | null;
  };

  // Count today's completed activities for the summary metadata.
  const activityCountRow = db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM activity_attempts
       WHERE date(completed_at) = ?`,
    )
    .get(date) as { cnt: number };
  const activitiesCount = activityCountRow.cnt;

  // Streak: walk back from `date` (inclusive) over consecutive daily_logs rows.
  const rows = db
    .prepare('SELECT log_date FROM daily_logs ORDER BY log_date DESC LIMIT 365')
    .all() as { log_date: string }[];
  const knownDays = new Set(rows.map((r) => r.log_date));
  knownDays.add(date); // include the row we're about to write

  let streak = 0;
  const cursor = new Date(`${date}T12:00:00Z`);
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (knownDays.has(iso)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  let vault_path: string | null = null;
  let markdown_path: string | null = null;

  if (isVaultConfigured()) {
    try {
      const written = await writeDailyLog({
        vault_path: getVaultPath(),
        date,
        notes,
        auto_summary,
        meta: {
          minutes,
          activities: activitiesCount,
          streak,
          mood,
        },
      });
      vault_path = written.markdown_path;
      markdown_path = written.markdown_path;
    } catch (err) {
      logger.warn(
        { err: (err as Error).message, date },
        'Failed to write daily log to vault — continuing with DB-only write',
      );
    }
  }

  const saved = db.transaction(() => {
    db.prepare(
      `INSERT INTO daily_logs
         (user_id, log_date, minutes, notes, auto_summary, vault_path, streak_at_end, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(log_date) DO UPDATE SET
         minutes       = excluded.minutes,
         notes         = excluded.notes,
         auto_summary  = excluded.auto_summary,
         vault_path    = excluded.vault_path,
         streak_at_end = excluded.streak_at_end,
         updated_at    = excluded.updated_at`,
    ).run(date, minutes, notes, auto_summary, vault_path, streak);

    return db.prepare('SELECT * FROM daily_logs WHERE log_date = ?').get(date) as Record<
      string,
      unknown
    >;
  })();

  res.json({ ...saved, markdown_path });
});

export default router;
