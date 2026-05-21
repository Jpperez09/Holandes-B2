// Small helpers that turn technical data into warm, plain language.
// Keeps jargon (FSRS / CEFR / slugs) out of the daily flow.

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** A friendly name for a CEFR band, e.g. "A0–A1" -> "A0–A1 · Foundation". */
const PHASE_NAMES: Record<string, string> = {
  'A0-A1': 'Foundation',
  'A1-A2': 'Survival',
  'A2-B1': 'Threshold',
  'B1-B2': 'Vantage',
};
export function bandLabel(band: string | null | undefined): string {
  if (!band) return 'Getting started';
  const phase = PHASE_NAMES[band];
  const pretty = band.replace('-', '–');
  return phase ? `${pretty} · ${phase}` : pretty;
}

export type ModuleStatus = 'not_started' | 'in_progress' | 'done';

export function moduleStatus(percentComplete: number): ModuleStatus {
  if (percentComplete >= 1) return 'done';
  if (percentComplete > 0) return 'in_progress';
  return 'not_started';
}

export function statusLabel(status: ModuleStatus): string {
  if (status === 'done') return 'Done';
  if (status === 'in_progress') return 'In progress';
  return 'Not started';
}

export function statusPillClass(status: ModuleStatus): string {
  if (status === 'done') return 'pill pill--done';
  if (status === 'in_progress') return 'pill pill--progress';
  return 'pill pill--new';
}

/** Emoji icon for an activity type (DB enum: vocab/grammar/reading/listening/writing/freeform). */
export function activityIcon(type: string): string {
  switch (type) {
    case 'vocab':
      return '🔤';
    case 'grammar':
      return '📖';
    case 'reading':
      return '📕';
    case 'listening':
      return '🎧';
    case 'writing':
      return '✍️';
    case 'speaking':
      return '🗣️';
    case 'real-world':
      return '🌍';
    default:
      return '✨';
  }
}

export function activityKind(type: string): string {
  switch (type) {
    case 'vocab':
      return 'Vocabulary';
    case 'grammar':
      return 'Grammar';
    case 'reading':
      return 'Reading';
    case 'listening':
      return 'Listening';
    case 'writing':
      return 'Writing';
    case 'speaking':
      return 'Speaking';
    case 'real-world':
      return 'Real-world task';
    default:
      return 'Practice';
  }
}

export function minutesLabel(min: number | null | undefined): string {
  if (!min || min <= 0) return '';
  return `~${min} min`;
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Next checkpoint level (every 10th). */
export function nextMilestone(currentLevel: number): number {
  const next = Math.ceil((currentLevel + 0.0001) / 10) * 10;
  return Math.min(next, 100);
}

export function cefrFromBand(band: string | null | undefined): string {
  if (!band) return 'Beginner';
  return band.replace('-', '–');
}

/** Pretty number with a fallback. */
export function num(n: number | null | undefined): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
