import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { DailyLog } from '../api/types';
import { todayIso } from '../lib/friendly';
import {
  addMinutes,
  elapsedMs,
  formatClock,
  isRunning,
  loadTimer,
  minutesToLog,
  pauseTimer,
  saveTimer,
  startTimer,
  type TimerState,
} from '../lib/studyTimer';

/**
 * Adds minutes to a day's log without touching its notes. Reads the log first
 * (a day with no log yet is fine) and stops if it cannot: writing without
 * reading could wipe the notes.
 */
async function addStudyMinutes(date: string, minutes: number): Promise<number> {
  let existing: DailyLog | null = null;
  try {
    existing = await endpoints.getDailyLog(date);
  } catch (err) {
    if (!(err instanceof ApiError && err.kind === 'not_found')) throw err;
  }
  const total = addMinutes(existing?.minutes, minutes);
  await endpoints.saveDailyLog(date, { notes: existing?.notes ?? '', minutes: total });
  return total;
}

/** Start / pause / finish. Finishing adds the time to the minutes of the day it was started on. */
export function StudyTimer({
  onLogged,
}: {
  /** Called after the minutes were saved, so the daily log below can show them. */
  onLogged: () => void;
}): React.JSX.Element {
  const [timer, setTimer] = useState<TimerState | null>(loadTimer);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const running = isRunning(timer);

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  function update(next: TimerState | null): void {
    setTimer(next);
    saveTimer(next);
  }

  function start(): void {
    setMsg(null);
    update(startTimer(timer, Date.now(), todayIso()));
  }

  function pause(): void {
    if (timer) update(pauseTimer(timer, Date.now()));
  }

  async function finish(): Promise<void> {
    if (!timer) return;
    // Stop the clock first: if saving fails the time is kept, paused, not lost.
    const stopped = pauseTimer(timer, Date.now());
    update(stopped);
    const minutes = minutesToLog(elapsedMs(stopped, Date.now()));
    if (minutes === 0) {
      update(null);
      setMsg({ ok: true, text: 'Menos de medio minuto: no se suma nada.' });
      return;
    }
    setBusy(true);
    try {
      const total = await addStudyMinutes(stopped.date, minutes);
      update(null);
      setMsg({
        ok: true,
        text: `Sumé ${minutes} min al ${stopped.date === todayIso() ? 'registro de hoy' : `registro del ${stopped.date}`} (total: ${total} min).`,
      });
      onLogged();
    } catch {
      setMsg({
        ok: false,
        text: 'No pude guardar los minutos. El tiempo sigue aquí: vuelve a pulsar Terminar.',
      });
    } finally {
      setBusy(false);
    }
  }

  const ms = timer ? elapsedMs(timer, now) : 0;
  const fromEarlierDay = timer !== null && timer.date !== todayIso();

  return (
    <div className="card study-timer" style={{ marginBottom: 22 }}>
      <div className="spread">
        <div>
          <strong>Temporizador de estudio</strong>
          <div className="faint">
            {timer === null
              ? 'Los minutos se suman solos al registro de hoy.'
              : running
                ? 'Contando…'
                : 'En pausa'}
            {fromEarlierDay && timer && ` · empezó el ${timer.date}`}
          </div>
        </div>
        <span className="study-timer__clock nowrap-num" aria-live="off">
          {formatClock(ms)}
        </span>
      </div>
      <div className="row mt-s">
        {running ? (
          <button type="button" className="btn btn--ghost" onClick={pause}>
            ⏸ Pausar
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={start} disabled={busy}>
            {timer === null ? '▶ Iniciar' : '▶ Seguir'}
          </button>
        )}
        {timer !== null && (
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => void finish()}
            disabled={busy}
          >
            {busy ? 'Guardando…' : '■ Terminar'}
          </button>
        )}
      </div>
      {msg && (
        <p className={'form-msg ' + (msg.ok ? 'form-msg--ok' : 'form-msg--err')}>{msg.text}</p>
      )}
    </div>
  );
}
