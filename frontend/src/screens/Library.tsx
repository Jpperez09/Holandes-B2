import React, { useState } from 'react';
import { INSIGHTS } from '../data/insights';

export function Library(): React.JSX.Element {
  const [openId, setOpenId] = useState<string | null>(INSIGHTS[0]?.id ?? null);

  return (
    <>
      <h1 className="page-title">Library</h1>
      <p className="page-sub">
        Short, friendly explanations of why this way of learning works. Read one
        whenever you're curious — no pressure.
      </p>

      <div className="stack">
        {INSIGHTS.map((insight) => {
          const open = openId === insight.id;
          return (
            <div key={insight.id} className="collapse">
              <button
                type="button"
                className="collapse__head"
                onClick={() => setOpenId(open ? null : insight.id)}
              >
                <span aria-hidden="true">{insight.emoji}</span>
                {insight.title}
                <span className="faint" style={{ marginLeft: 'auto' }}>
                  {open ? '▾' : '▸'}
                </span>
              </button>
              {open && (
                <div className="collapse__body">
                  <p className="mt-0">{insight.explanation}</p>

                  <div className="card card--soft">
                    <div className="eyebrow">Based on</div>
                    <p className="mb-0 muted">{insight.basedOn}</p>
                  </div>

                  <div className="card card--accent mt-m">
                    <div className="eyebrow">Try this today</div>
                    <p className="mb-0">{insight.tryToday}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="faint mt-l">
        These notes are paraphrased from the project's own learning research.
        They're here to encourage you — not to test you.
      </p>
    </>
  );
}
