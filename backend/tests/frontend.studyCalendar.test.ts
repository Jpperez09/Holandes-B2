import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALENDAR,
  dayKey,
  parseStudyCalendar,
  planForDay,
} from '../../frontend/src/lib/studyCalendar';
import { DEFAULT_STUDY_CALENDAR } from '../src/services/study-calendar';

// docs/SPEC_2026-10_v2.md, P5: Today follows the calendar. Dates are simulated.

interface Mod {
  id: number;
  module_id: string;
  sort_order: number;
  subtype: 'standard' | 'review';
  percent_complete: number;
}

/** MOD-001..MOD-018 (the first `done` finished) and the five weekly reviews, with the odd sort_order the app gives them. */
function curriculum(done: number): Mod[] {
  const standard = Array.from({ length: 18 }, (_, i): Mod => ({
    id: i + 1,
    module_id: `MOD-${String(i + 1).padStart(3, '0')}`,
    sort_order: i + 1,
    subtype: 'standard',
    percent_complete: i < done ? 1 : 0,
  }));
  const reviews = [2, 6, 10, 14, 18].map((so, i): Mod => ({
    id: 101 + i,
    module_id: `MOD-${101 + i}`,
    sort_order: so,
    subtype: 'review',
    percent_complete: 0,
  }));
  // out of order on purpose: the plan must not depend on the order it is given
  return [...reviews.reverse(), ...standard];
}

const plan = (date: string, done = 3, calendar = DEFAULT_CALENDAR) =>
  planForDay(date, calendar, curriculum(done));

describe('the days of October 2026', () => {
  it('knows the weekday of a date whatever the time zone of the machine', () => {
    expect(dayKey('2026-10-03')).toBe('sat');
    expect(dayKey('2026-10-04')).toBe('sun');
    expect(dayKey('2026-10-05')).toBe('mon');
    expect(dayKey('2026-10-07')).toBe('wed');
    expect(dayKey('2026-10-02')).toBe('fri');
  });

  it('Saturday 3 Oct: Today shows MOD-101', () => {
    const p = plan('2026-10-03');
    expect(p.mode).toBe('weekly-review');
    expect(p.module?.module_id).toBe('MOD-101');
  });

  it('Wednesday 7 Oct: no new module, only the review, with the Portuguese line', () => {
    const p = plan('2026-10-07');
    expect(p.mode).toBe('review-only');
    expect(p.module).toBeNull();
    expect(p.note).toBe('Hoy toca portugués');
  });

  it('every following Saturday gets the next weekly review', () => {
    const saturdays = ['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31'];
    expect(saturdays.map((d) => plan(d).module?.module_id)).toEqual(['MOD-101', 'MOD-102', 'MOD-103', 'MOD-104', 'MOD-105']);
  });

  it('Monday, Tuesday, Thursday and Friday: the next standard module', () => {
    for (const date of ['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09']) {
      const p = plan(date, 3);
      expect(p.mode, date).toBe('module');
      expect(p.module?.module_id, date).toBe('MOD-004'); // the first one not finished
      expect(p.note).toBeNull();
    }
  });

  it('Wednesday and Sunday never propose a module, whatever has been finished', () => {
    for (const date of ['2026-10-04', '2026-10-07', '2026-10-11', '2026-10-14']) {
      expect(plan(date, 0).module, date).toBeNull();
      expect(plan(date, 18).module, date).toBeNull();
    }
  });

  it('a review that is not finished does not hold back the next module on a study day', () => {
    expect(plan('2026-10-05', 5).module?.module_id).toBe('MOD-006');
  });
});

describe('edges of the weekly reviews', () => {
  it('before the plan starts, a Saturday is an ordinary study day', () => {
    const p = plan('2026-09-26', 2);
    expect(p.mode).toBe('module');
    expect(p.module?.module_id).toBe('MOD-003');
  });

  it('after the last review, a Saturday is an ordinary study day again', () => {
    const p = plan('2026-11-07', 6);
    expect(p.mode).toBe('module');
    expect(p.module?.module_id).toBe('MOD-007');
  });

  it('with no review modules at all, a Saturday falls back to the next module', () => {
    const noReviews = curriculum(3).filter((m) => m.subtype !== 'review');
    const p = planForDay('2026-10-03', DEFAULT_CALENDAR, noReviews);
    expect(p.mode).toBe('module');
    expect(p.module?.module_id).toBe('MOD-004');
  });

  it('when everything is finished a study day still shows the first module, not nothing', () => {
    expect(plan('2026-10-05', 18).module?.module_id).toBe('MOD-001');
  });

  it('counts weeks from the start date, so moving it moves the reviews', () => {
    const later = { ...DEFAULT_CALENDAR, weeklyReviewStart: '2026-10-10' };
    expect(plan('2026-10-10', 3, later).module?.module_id).toBe('MOD-101');
    expect(plan('2026-10-03', 3, later).mode).toBe('module'); // before the new start
  });
});

describe('reading the setting', () => {
  it('uses the default when the setting is missing, empty or broken', () => {
    for (const raw of [null, undefined, '', 'nope', '[]', 'null']) {
      expect(parseStudyCalendar(raw), String(raw)).toEqual(DEFAULT_CALENDAR);
    }
  });

  it('is the same as the default the backend stores', () => {
    expect(parseStudyCalendar(DEFAULT_STUDY_CALENDAR)).toEqual(DEFAULT_CALENDAR);
  });

  it('changes only the days that are given, ignoring invalid values', () => {
    const c = parseStudyCalendar('{"wed":"module","sun":"holiday","review_only_note":"Descanso","weekly_review_start":"soon"}');
    expect(c.days.wed).toBe('module');
    expect(c.days.sun).toBe('review-only'); // invalid mode: default kept
    expect(c.reviewOnlyNote).toBe('Descanso');
    expect(c.weeklyReviewStart).toBe(DEFAULT_CALENDAR.weeklyReviewStart);
    expect(plan('2026-10-07', 3, c).module?.module_id).toBe('MOD-004');
  });
});
