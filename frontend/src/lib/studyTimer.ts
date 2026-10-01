// The study timer on Today (start / pause / finish). Pure TypeScript so it can be
// tested; the timer is stored as timestamps, so it stays right if the tab sleeps
// or is reloaded. (docs/SPEC_2026-10_v2.md, P4)

export interface TimerState {
  /** Local day (YYYY-MM-DD) the timer was started on: the minutes are logged on that day. */
  date: string;
  /** Time already counted from earlier start/pause rounds. */
  accumulatedMs: number;
  /** When the current round began; null while paused. */
  startedAt: number | null;
}

const KEY = 'dutchb2.studyTimer';

export const isRunning = (state: TimerState | null): boolean => state !== null && state.startedAt !== null;

/** Starts a new timer, or resumes a paused one. A running timer is left as it is. */
export function startTimer(state: TimerState | null, now: number, today: string): TimerState {
  if (state === null) return { date: today, accumulatedMs: 0, startedAt: now };
  if (state.startedAt !== null) return state;
  return { ...state, startedAt: now };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.startedAt === null) return state;
  return {
    ...state,
    accumulatedMs: state.accumulatedMs + Math.max(0, now - state.startedAt),
    startedAt: null,
  };
}

export function elapsedMs(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

/** Whole minutes to log: rounded, so 30 s or more counts as 1 and 29 s as nothing. */
export const minutesToLog = (ms: number): number => Math.max(0, Math.round(ms / 60000));

/** The day's minutes after adding the timer's, never negative or fractional. */
export const addMinutes = (existing: number | null | undefined, add: number): number =>
  Math.max(0, Math.round(existing ?? 0)) + Math.max(0, Math.round(add));

/** "07:05", or "1:02:03" past an hour. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Reads a stored timer; anything that is not a valid state is ignored. */
export function parseTimer(raw: string | null): TimerState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<TimerState>;
    const okDate = typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date);
    const okAcc = typeof v.accumulatedMs === 'number' && Number.isFinite(v.accumulatedMs) && v.accumulatedMs >= 0;
    const okStart = v.startedAt === null || (typeof v.startedAt === 'number' && Number.isFinite(v.startedAt));
    return okDate && okAcc && okStart
      ? { date: v.date as string, accumulatedMs: v.accumulatedMs as number, startedAt: v.startedAt as number | null }
      : null;
  } catch {
    return null;
  }
}

export function loadTimer(): TimerState | null {
  try {
    return parseTimer(localStorage.getItem(KEY));
  } catch {
    return null; // storage may be unavailable
  }
}

export function saveTimer(state: TimerState | null): void {
  try {
    if (state === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable; the timer just will not survive a reload */
  }
}
