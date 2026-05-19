import { getDb } from '../db/connection';
import { logger } from '../config/logger';
import { getSetting } from './settings-service';

// Stub for TICKET-008 — today's plan generator.
// Full implementation in TICKET-008.

export interface PlanSlot {
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'freeform';
  title: string;
  estimatedMinutes: number;
  activityId?: number;
  cardCount?: number;
}

export interface TodayPlan {
  date: string;
  targetMinutes: number;
  slots: PlanSlot[];
  dueCardCount: number;
  streak: number;
}

export function generatePlan(): TodayPlan {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const goalMinutes = parseInt(getSetting('daily_goal_minutes') ?? '60', 10);

  // Count FSRS due cards
  let dueCount = 0;
  try {
    const row = db
      .prepare(
        "SELECT COUNT(*) as cnt FROM vocabulary_items WHERE status != 'suspended' AND status != 'archived' AND json_extract(fsrs_state, '$.due') <= datetime('now')"
      )
      .get() as { cnt: number };
    dueCount = row.cnt;
  } catch {
    // vocabulary table may be empty
  }

  // Compute streak from daily_logs
  let streak = 0;
  try {
    const rows = db
      .prepare(
        "SELECT log_date FROM daily_logs ORDER BY log_date DESC LIMIT 365"
      )
      .all() as { log_date: string }[];

    let checkDate = new Date();
    for (const row of rows) {
      const expected = checkDate.toISOString().slice(0, 10);
      if (row.log_date === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } catch {
    // daily_logs may be empty
  }

  const slots: PlanSlot[] = [];

  if (dueCount > 0) {
    const cardBatch = Math.min(dueCount, 20);
    slots.push({
      type: 'vocabulary',
      title: `Vocabulary review (${cardBatch} cards due)`,
      estimatedMinutes: Math.ceil(cardBatch * 0.5),
      cardCount: cardBatch,
    });
  }

  // Stub: next module activity TBD by TICKET-004/005
  slots.push({
    type: 'grammar',
    title: 'Grammar practice (module not indexed yet)',
    estimatedMinutes: 15,
  });

  logger.debug({ today, dueCount, slots: slots.length }, '[plan-generator] Plan generated');

  return {
    date: today,
    targetMinutes: goalMinutes,
    slots,
    dueCardCount: dueCount,
    streak,
  };
}
