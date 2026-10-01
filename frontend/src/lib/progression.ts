// Module progression rules shared by Learn, Today and Home.
//
// The path is linear over the STANDARD modules. Weekly review modules
// (subtype "review", ids MOD-101..) sit outside that chain: they never wait for
// the previous module, never hold back the next one, and never count as the
// "module up next". Pure functions on purpose, so they can be unit-tested.

import type { ModuleSummary } from '../api/types';

export type ProgressModule = Pick<
  ModuleSummary,
  'id' | 'sort_order' | 'subtype' | 'percent_complete'
>;

export function isReviewModule(m: Pick<ModuleSummary, 'subtype'>): boolean {
  return m.subtype === 'review';
}

export function bySortOrder<T extends { sort_order: number }>(modules: T[]): T[] {
  return [...modules].sort((a, b) => a.sort_order - b.sort_order);
}

/** Standard (non-review) modules, in order. */
export function standardModules<T extends ProgressModule>(modules: T[]): T[] {
  return bySortOrder(modules).filter((m) => !isReviewModule(m));
}

/**
 * Ids of modules the learner may open. A standard module is open when it is the
 * first one, the previous standard module is done, or it has been started
 * already (a module you touched must never read as locked). Reviews are always open.
 */
export function computeUnlocked(modules: ProgressModule[]): Set<number> {
  const chain = standardModules(modules);
  const unlocked = new Set<number>();
  chain.forEach((m, i) => {
    if (i === 0 || chain[i - 1].percent_complete >= 1 || m.percent_complete > 0) {
      unlocked.add(m.id);
    }
  });
  for (const m of modules) {
    if (isReviewModule(m)) unlocked.add(m.id);
  }
  return unlocked;
}

/** First standard module that is not finished yet, if any. */
export function firstUnfinishedStandard<T extends ProgressModule>(modules: T[]): T | undefined {
  return standardModules(modules).find((m) => m.percent_complete < 1);
}
