import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { requireVault } from '../middleware/require-vault';

const router = Router();

// GET /api/progress
router.get('/', requireVault, (_req: Request, res: Response) => {
  const db = getDb();

  // Latest skill scores per skill
  const skillScores = db
    .prepare(
      `SELECT skill, score, cefr_estimate, recorded_at
       FROM skill_scores
       WHERE (skill, recorded_at) IN (
         SELECT skill, MAX(recorded_at) FROM skill_scores GROUP BY skill
       )`
    )
    .all();

  // Open weak areas
  const weakAreas = db
    .prepare(
      `SELECT * FROM weak_areas WHERE resolved_at IS NULL ORDER BY severity DESC LIMIT 20`
    )
    .all();

  // Vocabulary summary
  const vocabStats = db
    .prepare(
      `SELECT status, COUNT(*) as count FROM vocabulary_items GROUP BY status`
    )
    .all() as { status: string; count: number }[];

  const vocabSummary: Record<string, number> = {};
  for (const row of vocabStats) {
    vocabSummary[row.status] = row.count;
  }

  // Grammar mastery
  const grammarSummary = db
    .prepare(
      `SELECT slug, title, mastery, last_reviewed_at FROM grammar_topics ORDER BY mastery DESC`
    )
    .all();

  // Activity counts last 7 days
  const recentActivity = db
    .prepare(
      `SELECT date(completed_at) as day, COUNT(*) as attempts
       FROM activity_attempts
       WHERE completed_at >= datetime('now', '-7 days')
       GROUP BY day
       ORDER BY day DESC`
    )
    .all();

  res.json({
    skillScores,
    weakAreas,
    vocabulary: vocabSummary,
    grammar: grammarSummary,
    recentActivity,
  });
});

export default router;
