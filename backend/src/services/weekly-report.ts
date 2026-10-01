import type Database from 'better-sqlite3';
import { getDb } from '../db/connection';

// Weekly report: a 7-day window ending on `end` (inclusive), by LOCAL day.
// daily_logs.log_date is a local date; reviewed_at / completed_at are stored in
// UTC by datetime('now'), so they are converted with 'localtime' before they
// are compared to the window.

export interface WeeklyMinutesDay {
  date: string;
  minutes: number;
  /** Reviews or completed activities that day, but 0 minutes logged. */
  unregistered: boolean;
}

export interface WeeklyCompletedModule {
  id: string;
  title: string;
  completedOn: string;
}

export interface WeeklyReport {
  start: string;
  end: string;
  minutesPerDay: WeeklyMinutesDay[];
  totalMinutes: number;
  modulesCompleted: { count: number; items: WeeklyCompletedModule[] };
  reviews: {
    count: number;
    goodOrBetter: number;
    /**
     * Share of ALL reviews graded Good (3) or Easy (4), first exposures of new
     * cards included; null when there were none. Not a retention figure: see `retention`.
     */
    percentGoodOrBetter: number | null;
  };
  /**
   * Real retention: only reviews of cards that were already in the FSRS Review
   * state, where Hard (2) or better counts as remembered. null when there were none.
   */
  retention: {
    count: number;
    correct: number;
    percent: number | null;
  };
  /** Cards whose first-ever review falls inside the window. */
  newCardsIntroduced: number;
  /** Cards overdue right now (not a snapshot of the window's last day). */
  dueCardsPending: number;
  /** Plain-text version, ready to paste into a chat. */
  text: string;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31). */
export function isValidIsoDate(value: string, db: Database.Database = getDb()): boolean {
  if (!DATE_RE.test(value)) return false;
  const row = db.prepare('SELECT date(?) AS d').get(value) as { d: string | null };
  return row.d === value;
}

export function localToday(db: Database.Database = getDb()): string {
  return (db.prepare(`SELECT date('now', 'localtime') AS d`).get() as { d: string }).d;
}

export function buildWeeklyReport(
  endDate?: string,
  db: Database.Database = getDb(),
): WeeklyReport {
  const end = endDate ?? localToday(db);
  const start = (db.prepare(`SELECT date(?, '-6 days') AS d`).get(end) as { d: string }).d;

  const minutesPerDay = db
    .prepare(
      `WITH RECURSIVE days(d) AS (
         SELECT ?
         UNION ALL
         SELECT date(d, '+1 day') FROM days WHERE d < ?
       )
       SELECT days.d AS date,
              COALESCE(dl.minutes, 0) AS minutes,
              CASE WHEN COALESCE(dl.minutes, 0) = 0 AND (
                     EXISTS (SELECT 1 FROM vocabulary_reviews r
                              WHERE date(r.reviewed_at, 'localtime') = days.d)
                  OR EXISTS (SELECT 1 FROM activity_attempts a
                              WHERE a.completed_at IS NOT NULL
                                AND date(a.completed_at, 'localtime') = days.d)
                   ) THEN 1 ELSE 0 END AS unregistered
         FROM days
         LEFT JOIN daily_logs dl ON dl.log_date = days.d
        ORDER BY days.d`,
    )
    .all(start, end)
    .map((row) => {
      const day = row as { date: string; minutes: number; unregistered: number };
      return { date: day.date, minutes: day.minutes, unregistered: day.unregistered === 1 };
    }) as WeeklyMinutesDay[];
  const totalMinutes = minutesPerDay.reduce((sum, day) => sum + day.minutes, 0);

  // A module counts as completed when every one of its activities has at least
  // one completed attempt; it was completed on the day the last of them first was.
  const modulesCompletedItems = db
    .prepare(
      `WITH first_done AS (
         SELECT a.id AS activity_id, l.module_id AS module_id,
                MIN(att.completed_at) AS done_at
           FROM activities a
           JOIN lessons l ON l.id = a.lesson_id
           LEFT JOIN activity_attempts att
                  ON att.activity_id = a.id AND att.completed_at IS NOT NULL
          GROUP BY a.id
       )
       SELECT COALESCE(m.source_id, m.slug) AS id,
              m.title AS title,
              date(MAX(fd.done_at), 'localtime') AS completedOn
         FROM first_done fd
         JOIN modules m ON m.id = fd.module_id
        GROUP BY m.id
       HAVING SUM(fd.done_at IS NULL) = 0
          AND date(MAX(fd.done_at), 'localtime') BETWEEN ? AND ?
        ORDER BY MAX(fd.done_at), m.sort_order`,
    )
    .all(start, end) as WeeklyCompletedModule[];

  const reviewRow = db
    .prepare(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN grade >= 3 THEN 1 ELSE 0 END), 0) AS goodOrBetter
         FROM vocabulary_reviews
        WHERE date(reviewed_at, 'localtime') BETWEEN ? AND ?`,
    )
    .get(start, end) as { count: number; goodOrBetter: number };

  // prev_state is the ts-fsrs Card as JSON before the review; state 2 = Review.
  // json_extract throws on malformed JSON, so it is only read when json_valid.
  const retentionRow = db
    .prepare(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN grade >= 2 THEN 1 ELSE 0 END), 0) AS correct
         FROM vocabulary_reviews
        WHERE date(reviewed_at, 'localtime') BETWEEN ? AND ?
          AND CASE WHEN json_valid(prev_state) THEN json_extract(prev_state, '$.state') END = 2`,
    )
    .get(start, end) as { count: number; correct: number };

  const newCardsIntroduced = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT vocabulary_id
             FROM vocabulary_reviews
            GROUP BY vocabulary_id
           HAVING date(MIN(reviewed_at), 'localtime') BETWEEN ? AND ?
         )`,
      )
      .get(start, end) as { n: number }
  ).n;

  const dueCardsPending = (
    db.prepare('SELECT COUNT(*) AS n FROM v_due_cards').get() as { n: number }
  ).n;

  const report: Omit<WeeklyReport, 'text'> = {
    start,
    end,
    minutesPerDay,
    totalMinutes,
    modulesCompleted: { count: modulesCompletedItems.length, items: modulesCompletedItems },
    reviews: {
      count: reviewRow.count,
      goodOrBetter: reviewRow.goodOrBetter,
      percentGoodOrBetter:
        reviewRow.count === 0 ? null : Math.round((reviewRow.goodOrBetter / reviewRow.count) * 100),
    },
    retention: {
      count: retentionRow.count,
      correct: retentionRow.correct,
      percent:
        retentionRow.count === 0 ? null : Math.round((retentionRow.correct / retentionRow.count) * 100),
    },
    newCardsIntroduced,
    dueCardsPending,
  };
  return { ...report, text: formatWeeklyText(report) };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekday(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T12:00:00Z`).getUTCDay()];
}

/** Plain-text summary, one fact per line, meant to be pasted into a chat. */
export function formatWeeklyText(report: Omit<WeeklyReport, 'text'>): string {
  const { reviews, retention, modulesCompleted } = report;
  const lines: string[] = [];
  lines.push(`Weekly summary: ${report.start} to ${report.end}`);
  lines.push(`Minutes studied: ${report.totalMinutes}`);
  for (const day of report.minutesPerDay) {
    lines.push(
      `  ${weekday(day.date)} ${day.date}: ${day.minutes}${day.unregistered ? ' (minutos sin registrar)' : ''}`,
    );
  }
  const unregistered = report.minutesPerDay.filter((d) => d.unregistered);
  if (unregistered.length > 0) {
    lines.push(
      `Días con minutos sin registrar: ${unregistered.map((d) => `${weekday(d.date)} ${d.date}`).join(', ')}`,
    );
  }
  lines.push(
    modulesCompleted.count === 0
      ? 'Modules completed: 0'
      : `Modules completed: ${modulesCompleted.count} (${modulesCompleted.items
          .map((m) => `${m.id} ${m.title}`)
          .join('; ')})`,
  );
  lines.push(`Reviews: ${reviews.count}`);
  if (reviews.count > 0) {
    // Two different figures, named so they are not mistaken for each other:
    // the first counts every review (first exposures too), the second only cards that were in Review.
    lines.push(
      `Calificaciones Good/Easy, todas las tarjetas: ${reviews.percentGoodOrBetter}% (${reviews.goodOrBetter} de ${reviews.count})`,
    );
    lines.push(
      `Retención real (repasos de tarjetas que ya estaban en Review, nota ≥2): ${
        retention.percent === null
          ? 'sin datos todavía'
          : `${retention.percent}% (${retention.correct} de ${retention.count})`
      }`,
    );
  }
  lines.push(`New cards introduced: ${report.newCardsIntroduced}`);
  lines.push(`Due cards pending: ${report.dueCardsPending}`);
  return lines.join('\n');
}
