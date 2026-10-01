import { describe, expect, it } from 'vitest';
import {
  advance,
  describeComing,
  dueAtMs,
  splitComing,
  startSession,
  type Grade,
  type Session,
} from '../../frontend/src/lib/reviewQueue';

// docs/SPEC_2026-10_v2.md, P3: a card graded "Again" must come back before the
// session ends, and when the queue runs out the screen offers what returns soon.

interface Card {
  id: number;
  fsrs_state?: string | null;
}
const card = (id: number): Card => ({ id });
const due = (id: number, iso: string): Card => ({ id, fsrs_state: JSON.stringify({ due: iso, state: 1 }) });

/** Plays a whole session: `grades` says what each showing of each card gets. Returns the ids in the order shown. */
function play(cards: Card[], grades: (id: number, nth: number) => Grade): number[] {
  let session: Session<Card> = startSession(cards);
  const shown: number[] = [];
  const seen = new Map<number, number>();
  for (let guard = 0; guard < 200; guard++) {
    const current = session.queue[session.idx];
    shown.push(current.id);
    const nth = (seen.get(current.id) ?? 0) + 1;
    seen.set(current.id, nth);
    const next = advance(session, grades(current.id, nth));
    if (next.finished) return shown;
    session = next;
  }
  throw new Error('session never finished');
}

describe('a card graded Again comes back before the session ends', () => {
  it('is shown a second time, after the cards that were still waiting', () => {
    const shown = play([card(1), card(2), card(3)], (id, nth) => (id === 1 && nth === 1 ? 1 : 3));
    expect(shown).toEqual([1, 2, 3, 1]);
  });

  it('does not end the session on the last card if that card was graded Again', () => {
    const shown = play([card(1), card(2)], (id, nth) => (id === 2 && nth === 1 ? 1 : 3));
    expect(shown).toEqual([1, 2, 2]);
  });

  it('keeps coming back until it is graded something else', () => {
    const shown = play([card(1), card(2)], (id, nth) => (id === 1 && nth <= 3 ? 1 : 3));
    expect(shown.filter((id) => id === 1)).toHaveLength(4);
    expect(shown[shown.length - 1]).toBe(1);
  });

  it('Hard, Good and Easy do not bring the card back', () => {
    for (const grade of [2, 3, 4] as Grade[]) {
      expect(play([card(1), card(2)], () => grade)).toEqual([1, 2]);
    }
  });

  it('puts the same card, not a copy of an older state, at the end and leaves the original queue untouched', () => {
    const start = startSession([card(1), card(2)]);
    const next = advance(start, 1);
    expect(next.queue).toHaveLength(3);
    expect(next.queue[2]).toBe(start.queue[0]);
    expect(start.queue).toHaveLength(2);
    expect(next.idx).toBe(1);
    expect(next.finished).toBe(false);
  });

  it('a one-card session graded Good is finished at once', () => {
    expect(advance(startSession([card(1)]), 3).finished).toBe(true);
  });
});

describe('what comes back soon', () => {
  const now = Date.parse('2026-10-01T11:30:00.000Z');
  const at = (minutes: number) => new Date(now + minutes * 60000).toISOString();

  it('reads the due time of a card from its FSRS state', () => {
    expect(dueAtMs(due(1, '2026-10-01T11:39:43.000Z'))).toBe(Date.parse('2026-10-01T11:39:43.000Z'));
    expect(dueAtMs(card(1))).toBeNull();
    expect(dueAtMs({ fsrs_state: 'not json' })).toBeNull();
    expect(dueAtMs({ fsrs_state: '{}' })).toBeNull();
  });

  it('splits ready-now from coming-back, soonest first, and rounds the wait up', () => {
    const cards = [due(1, at(12)), card(2), due(3, at(-1)), due(4, at(9.2))];
    const coming = splitComing(cards, now);
    expect(coming.ready.map((c) => c.id)).toEqual([2, 3]);
    expect(coming.soon.map((c) => c.id)).toEqual([4, 1]);
    expect(coming.minutesToNext).toBe(10); // 9.2 -> 10, never "0 min" for a card that is not due
  });

  it('says at least 1 minute for a card that is due in a few seconds', () => {
    expect(splitComing([due(1, new Date(now + 5000).toISOString())], now).minutesToNext).toBe(1);
  });

  it('has no wait when nothing is coming back', () => {
    expect(splitComing([], now)).toEqual({ ready: [], soon: [], minutesToNext: null });
    expect(splitComing([card(1)], now).minutesToNext).toBeNull();
  });

  it('writes "N tarjetas vuelven en X min"', () => {
    expect(describeComing(0, 3, 9)).toBe('3 tarjetas vuelven en 9 min');
    expect(describeComing(0, 1, 10)).toBe('1 tarjeta vuelve en 10 min');
    expect(describeComing(2, 0, null)).toBe('2 tarjetas listas ahora');
    expect(describeComing(1, 0, null)).toBe('1 tarjeta lista ahora');
    expect(describeComing(2, 3, 5)).toBe('2 tarjetas listas ahora y 3 tarjetas vuelven en 5 min');
    expect(describeComing(0, 0, null)).toBe('');
  });
});
