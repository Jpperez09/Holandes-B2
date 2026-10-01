// The `study_calendar` setting: what Today proposes on each weekday.
// (docs/SPEC_2026-10_v2.md, P5). Stored as JSON text in the settings table.
//
//   mon..sun              "module"         the next standard module
//                         "weekly-review"  this week's review module (MOD-101, MOD-102, …)
//                         "review-only"    no new module; only the word review
//   review_only_note      text shown on "review-only" days
//   weekly_review_start   the Saturday that gets the first weekly review (MOD-101);
//                         each following week gets the next one
//
// Days left out fall back to the default when Today reads it, so a partial
// calendar is valid.

export const DEFAULT_STUDY_CALENDAR =
  '{"mon":"module","tue":"module","wed":"review-only","thu":"module","fri":"module","sat":"weekly-review","sun":"review-only","review_only_note":"Hoy toca portugués","weekly_review_start":"2026-10-03"}';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MODES = ['module', 'weekly-review', 'review-only'];
const KEYS = new Set([...DAYS, 'review_only_note', 'weekly_review_start']);

/** A calendar date written as YYYY-MM-DD that really exists (not 2026-02-31). */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** null when the text is a valid study_calendar; otherwise what is wrong with it. */
export function validateStudyCalendar(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 'study_calendar must be JSON text.';
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return 'study_calendar must be a JSON object.';
  }
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!KEYS.has(key)) return `study_calendar has an unknown key: ${key}.`;
    if (DAYS.includes(key)) {
      if (typeof value !== 'string' || !MODES.includes(value)) {
        return `study_calendar.${key} must be one of: ${MODES.join(', ')}.`;
      }
    } else if (key === 'review_only_note') {
      if (typeof value !== 'string') return 'study_calendar.review_only_note must be text.';
    } else if (typeof value !== 'string' || !isRealDate(value)) {
      return 'study_calendar.weekly_review_start must be a real date as YYYY-MM-DD.';
    }
  }
  return null;
}
