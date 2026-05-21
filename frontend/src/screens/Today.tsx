import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { ModuleSummary, TodayPlan, VocabItem } from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView, ProgressBar } from '../components/ui';
import { getTodayDoneSteps, setTodayStep } from '../lib/storage';
import { num, todayIso } from '../lib/friendly';

interface TodayData {
  today: TodayPlan | null;
  dueCount: number;
  currentModule: ModuleSummary | null;
}

async function loadToday(): Promise<TodayData> {
  const modules = await endpoints.getModules();
  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
  const currentModule =
    sorted.find((m) => m.percent_complete < 1) ?? sorted[0] ?? null;

  let today: TodayPlan | null = null;
  try {
    today = await endpoints.getToday();
  } catch {
    today = null;
  }

  let dueCount = num(today?.dueCardCount);
  try {
    const due: VocabItem[] = await endpoints.getDueVocabulary();
    dueCount = due.length;
  } catch {
    /* keep today's count */
  }

  return { today, dueCount, currentModule };
}

interface Step {
  id: string;
  icon: string;
  title: string;
  meta: string;
  to: string | null;
  cta: string;
}

export function Today(): React.JSX.Element {
  const { data, error, loading, reload } = useApi(loadToday, []);
  const date = todayIso();
  const [doneSteps, setDoneSteps] = useState<Set<string>>(() =>
    getTodayDoneSteps(date),
  );

  function toggleStep(id: string): void {
    const next = new Set(doneSteps);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTodayStep(date, id, next.has(id));
    setDoneSteps(next);
  }

  function markStep(id: string, done: boolean): void {
    const next = new Set(doneSteps);
    if (done) next.add(id);
    else next.delete(id);
    setTodayStep(date, id, done);
    setDoneSteps(next);
  }

  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(d) => {
        const mod = d.currentModule;
        const modPath = mod ? `/learn/${mod.module_id}` : '/learn';

        const steps: Step[] = [
          {
            id: 'review',
            icon: '🔁',
            title: 'Review your words',
            meta:
              d.dueCount > 0
                ? `${d.dueCount} word${d.dueCount === 1 ? '' : 's'} ready · about ${Math.max(
                    1,
                    Math.ceil(d.dueCount * 0.5),
                  )} min`
                : "You're caught up — a quick look is still nice",
            to: '/review',
            cta: 'Start',
          },
          {
            id: 'module',
            icon: '📚',
            title: mod ? `Continue ${mod.title}` : 'Open your module',
            meta: mod
              ? `Module ${mod.module_id} · about ${num(mod.estimated_minutes) || 30} min`
              : 'Pick up where you left off',
            to: modPath,
            cta: 'Open',
          },
          {
            id: 'input',
            icon: '🎧',
            title: 'Practice listening & reading',
            meta: 'Take in some Dutch — a clip or a short text from your module',
            to: modPath,
            cta: 'Go',
          },
          {
            id: 'output',
            icon: '🗣️',
            title: 'Practice speaking & writing',
            meta: 'Produce some Dutch — say a sentence, write a few lines',
            to: modPath,
            cta: 'Go',
          },
        ];

        const totalSteps = steps.length + 1; // + daily log
        const doneCount =
          steps.filter((s) => doneSteps.has(s.id)).length +
          (doneSteps.has('log') ? 1 : 0);

        return (
          <>
            <h1 className="page-title">Today</h1>
            <p className="page-sub">
              A calm checklist for today. Do what you can — every step counts.
            </p>

            <div className="card card--soft" style={{ marginBottom: 22 }}>
              <div className="spread" style={{ marginBottom: 8 }}>
                <strong>Your day so far</strong>
                <span className="muted nowrap-num">
                  {doneCount} of {totalSteps}
                </span>
              </div>
              <ProgressBar value={doneCount / totalSteps} variant="accent" />
            </div>

            <div className="checklist">
              {steps.map((step, idx) => {
                const isDone = doneSteps.has(step.id);
                return (
                  <div
                    key={step.id}
                    className={'check-row' + (isDone ? ' is-done' : '')}
                  >
                    <button
                      type="button"
                      className={'check-box' + (isDone ? ' is-done' : '')}
                      onClick={() => toggleStep(step.id)}
                      aria-label={
                        isDone ? 'Mark step not done' : 'Mark step done'
                      }
                    >
                      {isDone ? '✓' : ''}
                    </button>
                    <span className="step-num">{idx + 1}</span>
                    <span className="check-row__icon" aria-hidden="true">
                      {step.icon}
                    </span>
                    <div className="check-row__body">
                      <div className="check-row__title">{step.title}</div>
                      <div className="check-row__meta">{step.meta}</div>
                    </div>
                    {step.to && (
                      <Link className="btn btn--ghost" to={step.to}>
                        {step.cta}
                      </Link>
                    )}
                  </div>
                );
              })}

              {/* Step 5 — daily log (always last, appended client-side) */}
              <DailyLogStep
                date={date}
                done={doneSteps.has('log')}
                onSaved={() => markStep('log', true)}
              />
            </div>

            {doneCount === totalSteps && (
              <div className="card card--accent mt-l center">
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <p className="mb-0">
                  <strong>That's your day. Nice work!</strong>
                  <br />
                  <Link to="/progress">See how far you've come →</Link>
                </p>
              </div>
            )}
          </>
        );
      }}
    </AsyncView>
  );
}

/** Step 5: inline daily-log editor. */
function DailyLogStep({
  date,
  done,
  onSaved,
}: {
  date: string;
  done: boolean;
  onSaved: () => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Prefill from any existing log for today.
  useEffect(() => {
    let cancelled = false;
    endpoints
      .getDailyLog(date)
      .then((log) => {
        if (cancelled) return;
        setNotes(log.notes ?? '');
        if (log.minutes) setMinutes(String(log.minutes));
        if (log.notes) onSaved();
      })
      .catch(() => {
        /* no log yet — fine */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function save(): Promise<void> {
    setSaving(true);
    setMsg(null);
    try {
      await endpoints.saveDailyLog(date, {
        notes: notes.trim(),
        minutes: parseInt(minutes, 10) || 0,
      });
      setMsg({ ok: true, text: 'Saved. See you tomorrow! 👋' });
      onSaved();
    } catch (err) {
      const text =
        err instanceof ApiError
          ? "That didn't save — let's try once more."
          : 'Something went wrong saving your log.';
      setMsg({ ok: false, text });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={'check-row' + (done ? ' is-done' : '')}>
      <button
        type="button"
        className={'check-box' + (done ? ' is-done' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open daily log"
      >
        {done ? '✓' : ''}
      </button>
      <span className="step-num">5</span>
      <span className="check-row__icon" aria-hidden="true">
        ✍️
      </span>
      <div className="check-row__body">
        <div className="check-row__title">Write today's log</div>
        <div className="check-row__meta">
          {done
            ? 'Written today — well done'
            : 'Two lines is enough. How did today feel?'}
        </div>

        {open && (
          <div className="mt-m">
            <textarea
              className="textarea"
              placeholder="What did you study today? What felt easy, what felt hard?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="field mt-s">
              <label htmlFor="log-minutes">
                Minutes studied{' '}
                <span className="hint">(optional)</span>
              </label>
              <input
                id="log-minutes"
                className="input"
                type="number"
                min={0}
                max={600}
                placeholder="e.g. 25"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save log'}
            </button>
            {msg && (
              <p className={'form-msg ' + (msg.ok ? 'form-msg--ok' : 'form-msg--err')}>
                {msg.text}
              </p>
            )}
          </div>
        )}
      </div>
      {!open && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setOpen(true)}
        >
          Write
        </button>
      )}
    </div>
  );
}
