import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  elapsedMs,
  formatClock,
  isRunning,
  minutesToLog,
  parseTimer,
  pauseTimer,
  startTimer,
  type TimerState,
} from '../../frontend/src/lib/studyTimer';

// docs/SPEC_2026-10_v2.md, P4: minutes were typed by hand and a forgotten day
// reported 0. The timer on Today adds to the day's minutes.

const T0 = Date.parse('2026-10-05T10:00:00.000Z');
const SEC = 1000;
const MIN = 60 * SEC;

describe('study timer', () => {
  it('starts on today, counts while running and stops counting when paused', () => {
    const running = startTimer(null, T0, '2026-10-05');
    expect(running).toEqual({ date: '2026-10-05', accumulatedMs: 0, startedAt: T0 });
    expect(isRunning(running)).toBe(true);
    expect(elapsedMs(running, T0 + 90 * SEC)).toBe(90 * SEC);

    const paused = pauseTimer(running, T0 + 10 * MIN);
    expect(isRunning(paused)).toBe(false);
    expect(elapsedMs(paused, T0 + 99 * MIN)).toBe(10 * MIN); // paused time does not count
  });

  it('adds up several rounds of start and pause', () => {
    let s: TimerState | null = startTimer(null, T0, '2026-10-05');
    s = pauseTimer(s, T0 + 5 * MIN);
    s = startTimer(s, T0 + 30 * MIN, '2026-10-05'); // resumes the same timer
    expect(elapsedMs(s, T0 + 37 * MIN)).toBe(12 * MIN);
    expect(s.date).toBe('2026-10-05');
  });

  it('keeps the day it was started on, even if it is resumed or finished the next day', () => {
    const s = startTimer(null, T0, '2026-10-05');
    const paused = pauseTimer(s, T0 + 20 * MIN);
    expect(startTimer(paused, T0 + 24 * 60 * MIN, '2026-10-06').date).toBe('2026-10-05');
  });

  it('starting a running timer, or pausing a paused one, changes nothing', () => {
    const running = startTimer(null, T0, '2026-10-05');
    expect(startTimer(running, T0 + MIN, '2026-10-05')).toBe(running);
    const paused = pauseTimer(running, T0 + MIN);
    expect(pauseTimer(paused, T0 + 2 * MIN)).toBe(paused);
  });

  it('never goes backwards if the clock does', () => {
    const running = startTimer(null, T0, '2026-10-05');
    expect(elapsedMs(running, T0 - 5 * MIN)).toBe(0);
    expect(pauseTimer(running, T0 - 5 * MIN).accumulatedMs).toBe(0);
  });

  it('logs whole minutes: 30 s counts as one, 29 s as nothing', () => {
    expect(minutesToLog(29 * SEC)).toBe(0);
    expect(minutesToLog(30 * SEC)).toBe(1);
    expect(minutesToLog(25 * MIN + 20 * SEC)).toBe(25);
    expect(minutesToLog(-5)).toBe(0);
  });

  it("adds the timer's minutes to what the day already has", () => {
    expect(addMinutes(null, 25)).toBe(25);
    expect(addMinutes(undefined, 25)).toBe(25);
    expect(addMinutes(10, 25)).toBe(35);
    expect(addMinutes(10.4, 24.6)).toBe(35);
    expect(addMinutes(-3, -2)).toBe(0);
  });

  it('shows the clock as mm:ss, and h:mm:ss past an hour', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65 * SEC)).toBe('01:05');
    expect(formatClock(59 * MIN + 59 * SEC)).toBe('59:59');
    expect(formatClock(3723 * SEC)).toBe('1:02:03');
    expect(formatClock(-1)).toBe('00:00');
  });

  it('survives a reload: reads a stored timer back, and ignores anything broken', () => {
    const stored = JSON.stringify({ date: '2026-10-05', accumulatedMs: 120000, startedAt: T0 });
    expect(parseTimer(stored)).toEqual({ date: '2026-10-05', accumulatedMs: 120000, startedAt: T0 });
    expect(parseTimer(JSON.stringify({ date: '2026-10-05', accumulatedMs: 0, startedAt: null }))?.startedAt).toBeNull();
    for (const bad of [null, '', 'nope', '{}', '[]', '{"date":"5/10","accumulatedMs":0,"startedAt":null}',
      '{"date":"2026-10-05","accumulatedMs":-1,"startedAt":null}', '{"date":"2026-10-05","accumulatedMs":0,"startedAt":"now"}']) {
      expect(parseTimer(bad), String(bad)).toBeNull();
    }
  });
});
