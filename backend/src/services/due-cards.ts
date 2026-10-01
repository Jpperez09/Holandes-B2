import type Database from 'better-sqlite3';
import { getDb } from '../db/connection';
import type { VocabularyItem } from '../types';
import { getSetting } from './settings-service';

export const DEFAULT_NEW_CARDS_PER_DAY = 10;
/** Upper bound on cards returned for one review queue. */
export const MAX_QUEUE_SIZE = 50;

export function getNewCardsPerDay(): number {
  const parsed = parseInt(getSetting('new_cards_per_day') ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_NEW_CARDS_PER_DAY;
}

/**
 * How many cards were introduced today: those whose FIRST row in
 * vocabulary_reviews falls on today's date. "Today" is the machine's local day
 * ('localtime'), not UTC — reviewed_at is stored in UTC by datetime('now').
 */
export function countNewCardsIntroducedToday(db: Database.Database): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT vocabulary_id
           FROM vocabulary_reviews
          GROUP BY vocabulary_id
         HAVING date(MIN(reviewed_at), 'localtime') = date('now', 'localtime')
       )`,
    )
    .get() as { n: number };
  return row.n;
}

/**
 * Never-reviewed cards from started modules (at least one completed activity
 * attempt), ordered by module sort_order then card id.
 */
function getNewCards(db: Database.Database, limit: number): VocabularyItem[] {
  return db
    .prepare(
      `SELECT v.*
         FROM vocabulary_items v
         JOIN modules m ON m.source_id = v.module_id
        WHERE v.status = 'new'
          AND v.fsrs_state IS NULL
          AND EXISTS (
            SELECT 1
              FROM lessons l
              JOIN activities a ON a.lesson_id = l.id
              JOIN activity_attempts att ON att.activity_id = a.id
             WHERE l.module_id = m.id
               AND att.completed_at IS NOT NULL
          )
        ORDER BY m.sort_order, v.id
        LIMIT ?`,
    )
    .all(limit) as VocabularyItem[];
}

/**
 * The review queue: overdue cards first (oldest due first), then new cards up
 * to whatever is left of today's new_cards_per_day budget.
 */
export function getDueCards(db: Database.Database = getDb()): VocabularyItem[] {
  const due = db
    .prepare(
      `SELECT * FROM v_due_cards
        ORDER BY datetime(json_extract(fsrs_state, '$.due')), id
        LIMIT ?`,
    )
    .all(MAX_QUEUE_SIZE) as VocabularyItem[];

  const room = MAX_QUEUE_SIZE - due.length;
  const budget = getNewCardsPerDay() - countNewCardsIntroducedToday(db);
  const take = Math.min(room, budget);
  if (take <= 0) return due;

  return [...due, ...getNewCards(db, take)];
}
