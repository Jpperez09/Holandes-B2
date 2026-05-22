import React, { useState } from 'react';
import {
  ALL_BANDS,
  CATEGORY_META,
  RESOURCES,
  type Resource,
  type ResourceBand,
  type ResourceCategory,
} from '../data/resources';
import { bandLabel } from '../lib/friendly';

const COST_LABEL: Record<Resource['cost'], { text: string; cls: string }> = {
  free: { text: 'Free', cls: 'pill pill--done' },
  freemium: { text: 'Free + paid', cls: 'pill pill--progress' },
  paid: { text: 'Paid', cls: 'pill pill--new' },
};

export function Resources(): React.JSX.Element {
  const [band, setBand] = useState<ResourceBand | 'all'>('all');

  const shown =
    band === 'all'
      ? RESOURCES
      : RESOURCES.filter((r) => r.bands.includes(band));

  // Group the filtered resources by category, in the defined category order.
  const categories = (Object.keys(CATEGORY_META) as ResourceCategory[]).sort(
    (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order,
  );

  return (
    <>
      <h1 className="page-title">Resources</h1>
      <p className="page-sub">
        Hand-picked, mostly free Dutch tools, videos and podcasts. Pick your
        level and find something to practise with today.
      </p>

      {/* Level filter */}
      <div className="filter-row" role="group" aria-label="Filter by level">
        <button
          type="button"
          className={'filter-chip' + (band === 'all' ? ' is-active' : '')}
          onClick={() => setBand('all')}
        >
          All levels
        </button>
        {ALL_BANDS.map((b) => (
          <button
            key={b}
            type="button"
            className={'filter-chip' + (band === b ? ' is-active' : '')}
            onClick={() => setBand(b)}
          >
            {bandLabel(b)}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="muted">No resources for this level yet.</p>
      )}

      {categories.map((cat) => {
        const items = shown.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <section key={cat}>
            <h2 className="section-title">
              {meta.icon} {meta.label}
            </h2>
            <div className="card-grid card-grid--2">
              {items.map((r) => (
                <div key={r.id} className="resource">
                  <div className="resource__head">
                    <span className="resource__name">{r.name}</span>
                    <span className={COST_LABEL[r.cost].cls}>
                      {COST_LABEL[r.cost].text}
                    </span>
                  </div>
                  <p className="resource__blurb">{r.blurb}</p>
                  <div className="resource__badges">
                    {r.bands.map((b) => (
                      <span key={b} className="chip">
                        {b.replace('-', '–')}
                      </span>
                    ))}
                  </div>
                  <a
                    className="btn btn--ghost"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="faint mt-l">
        These are external sites — they open in a new tab. The list is curated
        from the project's own resource research; it isn't sponsored.
      </p>
    </>
  );
}
