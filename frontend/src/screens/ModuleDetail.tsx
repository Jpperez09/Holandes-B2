import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { Activity, ModuleDetailResponse, VaultModuleRaw } from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView, ProgressBar } from '../components/ui';
import { Markdown, extractSection } from '../components/Markdown';
import { getCompletedActivities, markActivityDone } from '../lib/storage';
import {
  activityIcon,
  activityKind,
  minutesLabel,
  moduleStatus,
} from '../lib/friendly';

interface ModuleData {
  module: ModuleDetailResponse;
  body: string | null;
}

function loadModule(slug: string): () => Promise<ModuleData> {
  return async () => {
    const module = await endpoints.getModule(slug);
    let body: string | null = null;
    try {
      // The /api/modules/:slug response omits the Markdown body, so we fetch
      // the parsed body from the vault diagnostic route. Best-effort.
      const raw: VaultModuleRaw = await endpoints.getVaultModule(module.module_id);
      body = raw.body ?? null;
    } catch {
      body = null;
    }
    return { module, body };
  };
}

export function ModuleDetail(): React.JSX.Element {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(loadModule(slug), [slug]);

  return (
    <>
      <button
        type="button"
        className="btn btn--quiet"
        onClick={() => navigate('/learn')}
      >
        ← Back to Learn
      </button>
      <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
        {(d) => <ModuleView data={d} />}
      </AsyncView>
    </>
  );
}

function ModuleView({ data }: { data: ModuleData }): React.JSX.Element {
  const { module, body } = data;
  const activities = [...module.activities].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const [checked, setChecked] = useState<Set<number>>(() => {
    const stored = getCompletedActivities();
    return new Set(activities.filter((a) => stored.has(a.id)).map((a) => a.id));
  });
  const [percent, setPercent] = useState(module.percent_complete);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setPercent(module.percent_complete);
  }, [module.percent_complete]);

  async function complete(activity: Activity): Promise<void> {
    if (checked.has(activity.id)) return;
    setBusyId(activity.id);
    try {
      await endpoints.markActivityComplete(activity.id);
      markActivityDone(activity.id);
      setChecked((prev) => new Set(prev).add(activity.id));
      // Refresh the server-authoritative completion percentage.
      try {
        const fresh = await endpoints.getModule(module.module_id);
        setPercent(fresh.percent_complete);
      } catch {
        /* keep optimistic state */
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? "That didn't save — please try again."
          : 'Could not mark this done.';
      alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  const objectives = body ? extractSection(body, /learning objective/i) : null;
  const grammar = body ? extractSection(body, /grammar/i) : null;
  const realWorld = body
    ? extractSection(body, /real.?world task/i)
    : null;

  const status = moduleStatus(percent);
  const doneCount = checked.size;

  return (
    <>
      <div className="spread mt-s">
        <div>
          <span className="faint nowrap-num">{module.module_id}</span>
          <h1 className="page-title mt-0">{module.title}</h1>
        </div>
      </div>
      <p className="page-sub">
        Level {module.sort_order}
        {module.estimated_minutes
          ? ` · ${minutesLabel(module.estimated_minutes)}`
          : ''}
      </p>

      <div className="card card--soft">
        <div className="spread" style={{ marginBottom: 8 }}>
          <strong>Your progress in this module</strong>
          <span className="muted nowrap-num">
            {Math.round(percent * activities.length)} of {activities.length} done
          </span>
        </div>
        <ProgressBar
          value={percent}
          variant={status === 'done' ? 'done' : 'primary'}
        />
      </div>

      {/* What you'll learn */}
      {objectives && (
        <section className="detail-section">
          <h2 className="section-title mt-0">What you'll learn</h2>
          <div className="card">
            <Markdown source={objectives} />
          </div>
        </section>
      )}

      {/* Why it matters */}
      <section className="detail-section">
        <h2 className="section-title mt-0">Why it matters</h2>
        <div className="card card--tint">
          <p className="mb-0">
            Every module ends with something real you can do in Dutch. Finish
            this one and you'll be able to use it straight away — see the task
            near the bottom of this page.
          </p>
        </div>
      </section>

      {/* Vocabulary */}
      {module.vocabulary.length > 0 && (
        <section className="detail-section">
          <div className="spread">
            <h2 className="section-title mt-0">Words in this module</h2>
            <Link className="btn btn--ghost" to="/review">
              Review words
            </Link>
          </div>
          <div className="card">
            <div className="vocab-list">
              {module.vocabulary.map((v) => (
                <span key={v.id} className="vocab-item">
                  <b>
                    {v.article ? `${v.article} ` : ''}
                    {v.lemma}
                  </b>{' '}
                  <span>— {v.translation_en ?? ''}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grammar */}
      {grammar && (
        <section className="detail-section">
          <h2 className="section-title mt-0">The grammar idea</h2>
          <div className="card">
            <Markdown source={grammar} />
          </div>
        </section>
      )}

      {/* Activities */}
      <section className="detail-section">
        <h2 className="section-title mt-0">Your activities</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Work through these, then tick each one off.
        </p>
        <div className="checklist">
          {activities.length === 0 && (
            <div className="card card--soft muted">
              This module has no tracked activities yet.
            </div>
          )}
          {activities.map((a) => {
            const isDone = checked.has(a.id);
            return (
              <div
                key={a.id}
                className={'check-row' + (isDone ? ' is-done' : '')}
              >
                <button
                  type="button"
                  className={'check-box' + (isDone ? ' is-done' : '')}
                  onClick={() => void complete(a)}
                  disabled={isDone || busyId === a.id}
                  aria-label={isDone ? 'Completed' : 'Mark complete'}
                >
                  {isDone ? '✓' : ''}
                </button>
                <span className="check-row__icon" aria-hidden="true">
                  {activityIcon(a.type)}
                </span>
                <div className="check-row__body">
                  <div className="check-row__title">{a.title}</div>
                  <div className="check-row__meta">
                    {activityKind(a.type)}
                    {a.estimated_minutes
                      ? ` · ${minutesLabel(a.estimated_minutes)}`
                      : ''}
                    {isDone ? ' · completed' : ''}
                  </div>
                </div>
                {!isDone && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => void complete(a)}
                    disabled={busyId === a.id}
                  >
                    {busyId === a.id ? 'Saving…' : 'Mark done'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-world task */}
      {realWorld && (
        <section className="detail-section">
          <h2 className="section-title mt-0">One real thing to do 🌍</h2>
          <div className="card card--accent">
            <Markdown source={realWorld} />
          </div>
        </section>
      )}

      {/* Module complete affordance */}
      {status === 'done' && (
        <div className="card card--soft mt-l center">
          <div style={{ fontSize: '1.8rem' }}>🎉</div>
          <p className="mb-0">
            <strong>Module complete!</strong> Great work — the next module is
            now open.
          </p>
          <Link className="btn btn--primary mt-m" to="/learn">
            Back to Learn
          </Link>
        </div>
      )}

      {/* I need help */}
      <section className="detail-section">
        <div className="collapse">
          <button
            type="button"
            className="collapse__head"
            onClick={() => setHelpOpen((o) => !o)}
          >
            {helpOpen ? '▾' : '▸'} I need help
          </button>
          {helpOpen && (
            <div className="collapse__body">
              <p className="mt-0">
                Feeling stuck is completely normal — it's a sign you're
                learning something real.
              </p>
              <ul>
                <li>
                  Re-read the grammar idea above slowly. Read the Dutch examples
                  out loud.
                </li>
                <li>
                  Getting a word or word order wrong at first is expected —
                  that's the practice working, not a failure.
                </li>
                <li>
                  You don't have to be perfect to move on. Do your best, tick
                  the activity, and the words will come back in review.
                </li>
                <li>
                  Curious why the method works this way? Visit the{' '}
                  <Link to="/library">Library</Link> for short, friendly
                  explanations.
                </li>
              </ul>
              <p className="mb-0 faint">
                {doneCount > 0
                  ? `You've already completed ${doneCount} ${
                      doneCount === 1 ? 'activity' : 'activities'
                    } here — keep going.`
                  : "Start with the first activity — small steps add up."}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
