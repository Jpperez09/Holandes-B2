// localStorage helpers.
//
// The backend exposes only AGGREGATE module completion (v_module_completion gives
// counts, not which specific activities are done). To keep per-activity checkboxes
// visually consistent across reloads without a backend change, we remember which
// activity IDs this browser has marked complete. The progress BAR still uses the
// server's authoritative percent_complete — this is display-only memory.

const ACTIVITY_KEY = 'dutchb2.completedActivities';
const TODAY_STEPS_KEY = 'dutchb2.todaySteps';

function readSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) return new Set(arr.map(Number).filter(Number.isFinite));
  } catch {
    /* ignore corrupt storage */
  }
  return new Set();
}

function writeSet(key: string, set: Set<number>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* storage may be unavailable; ignore */
  }
}

export function getCompletedActivities(): Set<number> {
  return readSet(ACTIVITY_KEY);
}

export function markActivityDone(activityId: number): void {
  const set = readSet(ACTIVITY_KEY);
  set.add(activityId);
  writeSet(ACTIVITY_KEY, set);
}

// --- Today's checklist steps (ephemeral, reset each day) ---

type TodaySteps = { date: string; done: string[] };

export function getTodayDoneSteps(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(TODAY_STEPS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as TodaySteps;
    if (parsed.date === date && Array.isArray(parsed.done)) {
      return new Set(parsed.done);
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

export function setTodayStep(date: string, stepId: string, done: boolean): void {
  const current = getTodayDoneSteps(date);
  if (done) current.add(stepId);
  else current.delete(stepId);
  try {
    localStorage.setItem(
      TODAY_STEPS_KEY,
      JSON.stringify({ date, done: [...current] } satisfies TodaySteps),
    );
  } catch {
    /* ignore */
  }
}
