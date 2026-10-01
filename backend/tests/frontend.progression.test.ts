import { describe, expect, it } from 'vitest';

// The frontend has no test runner of its own; lib/progression.ts is pure TS with
// type-only imports, so the backend's vitest can exercise it directly.
import {
  computeUnlocked,
  firstUnfinishedStandard,
  isReviewModule,
  standardModules,
  type ProgressModule,
} from '../../frontend/src/lib/progression';

let nextId = 0;
const std = (sort_order: number, percent_complete = 0): ProgressModule => ({
  id: (nextId += 1),
  sort_order,
  subtype: 'standard',
  percent_complete,
});
const review = (sort_order: number, percent_complete = 0): ProgressModule => ({
  id: (nextId += 1),
  sort_order,
  subtype: 'review',
  percent_complete,
});

describe('weekly reviews never block the unlock chain', () => {
  it('a standard module after an unfinished review unlocks once the previous STANDARD one is done', () => {
    // 1 done, 2 done, [review not done], 3 untouched. The review sits between them in sort order.
    const m1 = std(1, 1);
    const m2 = std(2, 1);
    const r1 = review(2.5, 0);
    const m3 = std(3, 0);
    const unlocked = computeUnlocked([m1, m2, r1, m3]);
    expect(unlocked.has(m3.id)).toBe(true);
  });

  it('a review is always open, even when nothing has been completed', () => {
    const m1 = std(1, 0);
    const r1 = review(101, 0);
    expect(computeUnlocked([m1, r1]).has(r1.id)).toBe(true);
  });

  it('does not unlock a standard module whose previous standard module is unfinished', () => {
    const m1 = std(1, 0.5);
    const r1 = review(1.5, 1); // a finished review does not help either
    const m2 = std(2, 0);
    expect(computeUnlocked([m1, r1, m2]).has(m2.id)).toBe(false);
  });

  it('keeps the first standard module open and any module you have already started', () => {
    const m1 = std(1, 0);
    const m2 = std(2, 0);
    const m3 = std(3, 0.2); // started out of order: stays reachable
    const unlocked = computeUnlocked([m1, m2, m3]);
    expect(unlocked.has(m1.id)).toBe(true);
    expect(unlocked.has(m2.id)).toBe(false);
    expect(unlocked.has(m3.id)).toBe(true);
  });

  it('works when reviews use the high MOD-101.. range (sorted after all standard modules)', () => {
    const standards = [std(1, 1), std(2, 1), std(3, 0), std(4, 0)];
    const reviews = [review(101, 0), review(102, 0)];
    const unlocked = computeUnlocked([...reviews, ...standards]); // input order must not matter
    expect(unlocked.has(standards[2].id)).toBe(true); // next after the last done
    expect(unlocked.has(standards[3].id)).toBe(false); // still waiting on the one before it
    expect(reviews.every((r) => unlocked.has(r.id))).toBe(true);
  });
});

describe('the module "up next"', () => {
  it('skips reviews: an unfinished review never becomes the current module', () => {
    const m1 = std(1, 1);
    const r1 = review(1.5, 0);
    const m2 = std(2, 0);
    expect(firstUnfinishedStandard([m1, r1, m2])).toBe(m2);
  });

  it('is undefined when every standard module is done, even if a review is not', () => {
    expect(firstUnfinishedStandard([std(1, 1), std(2, 1), review(101, 0)])).toBeUndefined();
  });

  it('standardModules drops reviews and sorts by sort_order', () => {
    const a = std(3);
    const b = std(1);
    const r = review(2);
    expect(standardModules([a, r, b])).toEqual([b, a]);
  });

  it('only subtype "review" counts as a review', () => {
    expect(isReviewModule({ subtype: 'review' })).toBe(true);
    expect(isReviewModule({ subtype: 'standard' })).toBe(false);
    expect(isReviewModule({ subtype: null })).toBe(false);
  });
});
