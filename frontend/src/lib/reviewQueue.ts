// The queue of one Review session. Pure TypeScript so it can be tested.
//
// FSRS (short-term on) schedules "Again" about a minute out and "Good" on a new
// card about ten minutes out. Review used to load its queue once and stop, so
// those cards only came back if the learner reopened Review.
// (docs/SPEC_2026-10_v2.md, P3)

export type Grade = 1 | 2 | 3 | 4;

/** At the end of the queue, cards coming back within this many minutes are offered. */
export const SOON_MINUTES = 20;

export interface Session<T> {
  queue: T[];
  /** Index of the card being shown; equal to queue.length when the session is over. */
  idx: number;
}

export const startSession = <T>(cards: readonly T[]): Session<T> => ({ queue: [...cards], idx: 0 });

/**
 * The session after the card on screen was graded. A card graded 1 (Again) goes
 * to the end of the queue, so it is shown again before the session finishes.
 */
export function advance<T>(session: Session<T>, grade: Grade): Session<T> & { finished: boolean } {
  const card = session.queue[session.idx];
  const queue = grade === 1 && card !== undefined ? [...session.queue, card] : [...session.queue];
  const idx = session.idx + 1;
  return { queue, idx, finished: idx >= queue.length };
}

/** When the card is due (ms since epoch), read from its FSRS state; null for a never-reviewed card. */
export function dueAtMs(card: { fsrs_state?: string | null }): number | null {
  if (!card.fsrs_state) return null;
  try {
    const due = (JSON.parse(card.fsrs_state) as { due?: string }).due;
    const ms = due ? Date.parse(due) : NaN;
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

export interface Coming<T> {
  /** Due now (or brand new): can be reviewed right away. */
  ready: T[];
  /** Not due yet, soonest first. */
  soon: T[];
  /** Whole minutes until the first of `soon` (at least 1); null when there is none. */
  minutesToNext: number | null;
}

/** Splits what /api/vocabulary/due?within_minutes=N returned into "ready now" and "coming back". */
export function splitComing<T extends { fsrs_state?: string | null }>(
  cards: readonly T[],
  now: number,
): Coming<T> {
  const ready: T[] = [];
  const later: { card: T; at: number }[] = [];
  for (const card of cards) {
    const at = dueAtMs(card);
    if (at === null || at <= now) ready.push(card);
    else later.push({ card, at });
  }
  later.sort((a, b) => a.at - b.at);
  return {
    ready,
    soon: later.map((l) => l.card),
    minutesToNext: later.length > 0 ? Math.max(1, Math.ceil((later[0].at - now) / 60000)) : null,
  };
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** "3 tarjetas vuelven en 9 min", "2 tarjetas listas ahora", or both; '' when nothing is coming. */
export function describeComing(ready: number, soon: number, minutes: number | null): string {
  const soonText =
    soon > 0 && minutes !== null
      ? `${plural(soon, 'tarjeta vuelve', 'tarjetas vuelven')} en ${minutes} min`
      : '';
  const readyText = ready > 0 ? `${plural(ready, 'tarjeta lista', 'tarjetas listas')} ahora` : '';
  if (readyText && soonText) return `${readyText} y ${soonText}`;
  return readyText || soonText;
}
