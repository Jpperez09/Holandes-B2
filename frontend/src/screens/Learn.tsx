import React from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import type { ModuleSummary } from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView, EmptyState, ProgressBar } from '../components/ui';
import {
  bandLabel,
  minutesLabel,
  moduleStatus,
  statusLabel,
  statusPillClass,
} from '../lib/friendly';
import { bySortOrder, computeUnlocked, isReviewModule } from '../lib/progression';

// Weekly review modules get their own group, after the standard path.
const REVIEW_GROUP = 'weekly-review';

export function Learn(): React.JSX.Element {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => endpoints.getModules(),
    [],
  );

  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(modules) => {
        if (modules.length === 0) {
          return (
            <EmptyState
              icon="📚"
              title="No modules yet"
              message="Once your Dutch vault is connected, your modules will appear here."
            />
          );
        }

        const sorted = bySortOrder(modules);

        // Group by CEFR band, preserving order; weekly reviews form their own group.
        const groups: { band: string; modules: ModuleSummary[] }[] = [];
        for (const m of sorted) {
          const band = isReviewModule(m) ? REVIEW_GROUP : (m.cefr_band ?? 'Other');
          let g = groups.find((x) => x.band === band);
          if (!g) {
            g = { band, modules: [] };
            groups.push(g);
          }
          g.modules.push(m);
        }

        // Linear unlock over the standard modules (see lib/progression.ts):
        // weekly reviews never block the chain and are always open.
        const unlocked = computeUnlocked(sorted);

        return (
          <>
            <h1 className="page-title">Learn</h1>
            <p className="page-sub">
              Your Dutch path, one module at a time. Start at the top and work down.
            </p>

            {groups.map((g) => (
              <section key={g.band}>
                <h2 className="section-title">
                  {g.band === REVIEW_GROUP ? 'Repasos semanales' : bandLabel(g.band)}
                </h2>
                <div className="card-grid card-grid--2">
                  {g.modules.map((m) => {
                    const status = moduleStatus(m.percent_complete);
                    const isOpen = unlocked.has(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        className={'tile' + (isOpen ? '' : ' is-locked')}
                        disabled={!isOpen}
                        onClick={() =>
                          isOpen && navigate(`/learn/${m.module_id}`)
                        }
                      >
                        <div className="spread">
                          <span className="faint nowrap-num">
                            {m.module_id}
                          </span>
                          {isOpen ? (
                            <span className={statusPillClass(status)}>
                              {status === 'done' ? '✓ ' : ''}
                              {statusLabel(status)}
                            </span>
                          ) : (
                            <span className="pill pill--locked">🔒 Locked</span>
                          )}
                        </div>
                        <div className="tile__title">{m.title}</div>
                        <div className="tile__meta">
                          {isReviewModule(m) ? 'Repaso semanal' : `Level ${m.sort_order}`}
                          {m.estimated_minutes
                            ? ` · ${minutesLabel(m.estimated_minutes)}`
                            : ''}
                          {m.vocabulary_count
                            ? ` · ${m.vocabulary_count} words`
                            : ''}
                        </div>
                        <div className="mt-m">
                          <ProgressBar
                            value={m.percent_complete}
                            variant={status === 'done' ? 'done' : 'primary'}
                          />
                        </div>
                        {!isOpen && (
                          <div className="tile__meta mt-s">
                            Finish the module above to open this one.
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        );
      }}
    </AsyncView>
  );
}
