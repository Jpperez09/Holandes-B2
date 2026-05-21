import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import type { DailyLog, ModuleSummary, SettingsMap, TodayPlan } from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView } from '../components/ui';
import { INSIGHTS } from '../data/insights';
import { bandLabel, greeting, moduleStatus, num, todayIso } from '../lib/friendly';

interface HomeData {
  settings: SettingsMap;
  modules: ModuleSummary[];
  today: TodayPlan | null;
  dueCount: number;
  logsToday: boolean;
}

async function loadHome(): Promise<HomeData> {
  // settings + modules are required; today + due + daily-logs are best-effort.
  const [settings, modules] = await Promise.all([
    endpoints.getSettings(),
    endpoints.getModules(),
  ]);
  let today: TodayPlan | null = null;
  try {
    today = await endpoints.getToday();
  } catch {
    today = null;
  }
  // The /api/today stub under-counts brand-new cards, so use the due queue
  // directly for an honest "words to review" number.
  let dueCount = 0;
  try {
    const due = await endpoints.getDueVocabulary();
    dueCount = due.length;
  } catch {
    dueCount = 0;
  }
  let logsToday = false;
  try {
    const logs = await endpoints.getDailyLogs();
    logsToday = logs.some((l: DailyLog) => l.log_date === todayIso());
  } catch {
    logsToday = false;
  }
  return { settings, modules, today, dueCount, logsToday };
}

export function Home(): React.JSX.Element {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(loadHome, []);

  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(d) => {
        const name = d.settings['user_name'] || 'there';
        const sortedModules = [...d.modules].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        const currentModule =
          sortedModules.find((m) => m.percent_complete < 1) ??
          sortedModules[sortedModules.length - 1] ??
          null;
        const allDone =
          sortedModules.length > 0 &&
          sortedModules.every((m) => m.percent_complete >= 1);
        const levelNum = parseInt(d.settings['current_level'] || '1', 10) || 1;
        const dueCards = d.dueCount;
        const streak = num(d.today?.streak);

        // Pick a stable insight for the day.
        const insight =
          INSIGHTS[new Date().getDate() % INSIGHTS.length] ?? INSIGHTS[0];

        // Today's plan summary sentence.
        const parts: string[] = [];
        if (dueCards > 0) parts.push(`${dueCards} words to review`);
        if (currentModule && !allDone) parts.push(`continue ${currentModule.title}`);
        const planSentence =
          parts.length > 0
            ? parts.join(' · ')
            : 'A gentle review to keep things fresh';

        return (
          <>
            <h1 className="greeting">
              {greeting()}, {name} 👋
            </h1>
            <div className="home-meta">
              <span>
                You're on <strong>Level {levelNum}</strong>
                {currentModule?.cefr_band
                  ? ` · ${bandLabel(currentModule.cefr_band)}`
                  : ''}
              </span>
              {streak > 0 && (
                <span className="streak">🔥 {streak}-day streak</span>
              )}
            </div>

            {/* Hero — the one big action */}
            <div className="hero">
              <div className="hero__label">Today's plan</div>
              <p className="hero__line">{planSentence}</p>
              <p className="hero__sub">
                {d.today
                  ? `About ${num(d.today.targetMinutes) || 30} minutes — one calm session.`
                  : 'A short daily session keeps Dutch moving forward.'}
              </p>
              <button
                type="button"
                className="btn btn--big"
                onClick={() => navigate('/today')}
              >
                ▶ Start today's lesson
              </button>
            </div>

            {/* Quick actions */}
            <h2 className="section-title">Or jump straight to</h2>
            <div className="card-grid">
              <Link className="tile" to="/learn">
                <div className="tile__icon">📚</div>
                <div className="tile__title">Continue learning</div>
                <div className="tile__meta">
                  {currentModule
                    ? allDone
                      ? 'All modules done — great work!'
                      : `${currentModule.title}`
                    : 'Open your modules'}
                </div>
              </Link>

              <Link className="tile" to="/review">
                <div className="tile__icon">🔁</div>
                <div className="tile__title">Review vocabulary</div>
                <div className="tile__meta">
                  {dueCards > 0
                    ? `${dueCards} word${dueCards === 1 ? '' : 's'} ready`
                    : "You're caught up"}
                </div>
              </Link>

              <Link className="tile" to="/today">
                <div className="tile__icon">✍️</div>
                <div className="tile__title">Write daily log</div>
                <div className="tile__meta">
                  {d.logsToday ? 'Written today ✓' : 'Not written yet'}
                </div>
              </Link>

              <Link className="tile" to="/progress">
                <div className="tile__icon">📈</div>
                <div className="tile__title">View progress</div>
                <div className="tile__meta">
                  {sortedModules.filter((m) => moduleStatus(m.percent_complete) === 'done')
                    .length}{' '}
                  of {sortedModules.length} modules done
                </div>
              </Link>
            </div>

            {/* Learning insight */}
            <h2 className="section-title">A little learning insight</h2>
            <Link to="/library" className="card card--accent block-link">
              <div className="insight-strip">
                <div className="insight-strip__emoji">{insight.emoji}</div>
                <div>
                  <strong>{insight.title}</strong>
                  <p className="mb-0 muted mt-s">
                    {insight.explanation.split('. ')[0]}. → Read more in the Library
                  </p>
                </div>
              </div>
            </Link>
          </>
        );
      }}
    </AsyncView>
  );
}
