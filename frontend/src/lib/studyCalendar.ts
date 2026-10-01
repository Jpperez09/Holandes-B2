// What Today proposes on a given day, from the `study_calendar` setting.
// Pure functions of (date, calendar, modules), so the date can be simulated in
// tests. (docs/SPEC_2026-10_v2.md, P5)

import { firstUnfinishedStandard, isReviewModule, standardModules, type ProgressModule } from './progression';

export type DayMode = 'module' | 'weekly-review' | 'review-only';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface StudyCalendar {
  days: Record<DayKey, DayMode>;
  /** Shown on "review-only" days. */
  reviewOnlyNote: string;
  /** The Saturday that gets the first weekly review (MOD-101); the next week gets MOD-102, and so on. */
  weeklyReviewStart: string;
}

/** Same as the migration's default: keep the two in step. */
export const DEFAULT_CALENDAR: StudyCalendar = {
  days: {
    mon: 'module',
    tue: 'module',
    wed: 'review-only',
    thu: 'module',
    fri: 'module',
    sat: 'weekly-review',
    sun: 'review-only',
  },
  reviewOnlyNote: 'Hoy toca portugués',
  weeklyReviewStart: '2026-10-03',
};

const MODES: DayMode[] = ['module', 'weekly-review', 'review-only'];
const DAY_BY_UTC_INDEX: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Reads the setting's JSON text; a missing, broken or partial value falls back to the default, day by day. */
export function parseStudyCalendar(raw: string | null | undefined): StudyCalendar {
  const calendar: StudyCalendar = { ...DEFAULT_CALENDAR, days: { ...DEFAULT_CALENDAR.days } };
  if (!raw) return calendar;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return calendar;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return calendar;
  const value = parsed as Record<string, unknown>;
  for (const day of DAY_BY_UTC_INDEX) {
    const mode = value[day];
    if (typeof mode === 'string' && (MODES as string[]).includes(mode)) calendar.days[day] = mode as DayMode;
  }
  if (typeof value['review_only_note'] === 'string') calendar.reviewOnlyNote = value['review_only_note'];
  const start = value['weekly_review_start'];
  if (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(start)) calendar.weeklyReviewStart = start;
  return calendar;
}

/** The weekday of a YYYY-MM-DD date. Read at noon UTC so the machine's time zone cannot move it. */
export function dayKey(dateIso: string): DayKey {
  return DAY_BY_UTC_INDEX[new Date(`${dateIso}T12:00:00Z`).getUTCDay()];
}

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);

const moduleNumber = (id: string): number => parseInt(id.replace(/\D/g, ''), 10) || 0;

export interface DayPlan<M> {
  day: DayKey;
  /** What is really proposed. A "weekly-review" day with no review to give shows as "module". */
  mode: DayMode;
  /** The module to study today; null on review-only days. */
  module: M | null;
  /** The line to show on review-only days. */
  note: string | null;
}

export function planForDay<M extends ProgressModule & { module_id: string }>(
  dateIso: string,
  calendar: StudyCalendar,
  modules: M[],
): DayPlan<M> {
  const day = dayKey(dateIso);
  const mode = calendar.days[day];
  const nextStandard = (): M | null => firstUnfinishedStandard(modules) ?? standardModules(modules)[0] ?? null;

  if (mode === 'review-only') {
    return { day, mode, module: null, note: calendar.reviewOnlyNote || null };
  }

  if (mode === 'weekly-review') {
    // Week 0 is the one that contains the start date: MOD-101, then MOD-102, ...
    const reviews = modules
      .filter((m) => isReviewModule(m))
      .sort((a, b) => moduleNumber(a.module_id) - moduleNumber(b.module_id));
    const week = Math.floor(daysBetween(calendar.weeklyReviewStart, dateIso) / 7);
    const review = week >= 0 ? reviews[week] : undefined;
    if (review) return { day, mode, module: review, note: null };
    // Before the plan starts, or after its last review: an ordinary study day.
    return { day, mode: 'module', module: nextStandard(), note: null };
  }

  return { day, mode, module: nextStandard(), note: null };
}
