import React from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type {
  DailyLog,
  ModuleSummary,
  ProgressResponse,
  SettingsMap,
  VocabStats,
} from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView, ProgressBar } from '../components/ui';
import { moduleStatus, nextMilestone, num } from '../lib/friendly';

interface ProgressData {
  progress: ProgressResponse;
  modules: ModuleSummary[];
  vocab: VocabStats;
  settings: SettingsMap;
  logs: DailyLog[];
}

async function loadProgress(): Promise<ProgressData> {
  const [progress, modules, vocab, settings] = await Promise.all([
    endpoints.getProgress(),
    endpoints.getModules(),
    endpoints.getVocabularyStats(),
    endpoints.getSettings(),
  ]);
  let logs: DailyLog[] = [];
  try {
    logs = await endpoints.getDailyLogs();
  } catch {
    logs = [];
  }
  return { progress, modules, vocab, settings, logs };
}

const SKILL_LABELS: Record<string, string> = {
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
  writing: 'Writing',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
};

export function Progress(): React.JSX.Element {
  const { data, error, loading, reload } = useApi(loadProgress, []);
  const [showSkills, setShowSkills] = React.useState(false);
  const [copying, setCopying] = React.useState(false);
  const [copyMsg, setCopyMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [copyFallback, setCopyFallback] = React.useState<string | null>(null);

  async function copyWeeklySummary(): Promise<void> {
    setCopying(true);
    setCopyMsg(null);
    setCopyFallback(null);
    try {
      const stats = await endpoints.getWeeklyStats();
      try {
        await navigator.clipboard.writeText(stats.text);
        setCopyMsg({ ok: true, text: 'Copiado. Ya puedes pegarlo en el chat.' });
      } catch {
        // Clipboard blocked: show the text so it can be copied by hand.
        setCopyFallback(stats.text);
        setCopyMsg({
          ok: false,
          text: 'No pude copiarlo solo. Selecciona el texto de abajo y cópialo.',
        });
      }
    } catch (err) {
      setCopyMsg({
        ok: false,
        text:
          err instanceof ApiError && err.kind === 'offline'
            ? 'No hay conexión con la app. Revisa que siga corriendo.'
            : 'No se pudo cargar el resumen. Inténtalo de nuevo.',
      });
    } finally {
      setCopying(false);
    }
  }

  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(d) => {
        const level = parseInt(d.settings['current_level'] || '1', 10) || 1;
        const modulesDone = d.modules.filter(
          (m) => moduleStatus(m.percent_complete) === 'done',
        );
        const wordsLearned =
          num(d.vocab.learning) + num(d.vocab.review) + num(d.vocab.mature);
        const studyDays = d.logs.length;
        const streak = d.logs.length ? num(d.logs[0].streak_at_end) : 0;

        // Recent wins
        const wins: string[] = [];
        for (const m of modulesDone.slice(-3).reverse()) {
          wins.push(`Finished ${m.title}`);
        }
        if (streak > 1) wins.push(`${streak}-day study streak`);
        if (wordsLearned > 0) {
          wins.push(`Started learning ${wordsLearned} Dutch words`);
        }
        if (wins.length === 0) {
          wins.push("You've begun — that's the hardest step. 🎉");
        }

        const milestone = nextMilestone(level);
        const skills = d.progress.skillScores;

        return (
          <>
            <h1 className="page-title">Your Dutch journey</h1>
            <p className="page-sub">
              A look at how far you've come. Steady steps, real progress.
            </p>

            {/* Big friendly stats */}
            <div className="card-grid">
              <div className="stat">
                <div className="stat__value nowrap-num">{level} / 100</div>
                <div className="stat__label">Current level</div>
              </div>
              <div className="stat">
                <div className="stat__value nowrap-num">
                  {modulesDone.length} / {d.modules.length}
                </div>
                <div className="stat__label">Modules completed</div>
              </div>
              <div className="stat">
                <div className="stat__value nowrap-num">{wordsLearned}</div>
                <div className="stat__label">Words learned</div>
                <div className="stat__hint">
                  {num(d.vocab.new)} more to discover
                </div>
              </div>
              <div className="stat">
                <div className="stat__value nowrap-num">{studyDays}</div>
                <div className="stat__label">
                  Study {studyDays === 1 ? 'day' : 'days'} logged
                </div>
              </div>
            </div>

            {/* Recent wins */}
            <h2 className="section-title">Recent wins 🎉</h2>
            <div className="card">
              <ul className="win-list">
                {wins.map((w, i) => (
                  <li key={i}>
                    <span aria-hidden="true">✅</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next milestone */}
            <h2 className="section-title">Next milestone</h2>
            <div className="card card--tint">
              <p className="mb-0">
                <strong>Level {milestone}</strong> — your next checkpoint.{' '}
                {milestone > level
                  ? `${milestone - level} level${
                      milestone - level === 1 ? '' : 's'
                    } to go.`
                  : "You're right at it — keep going!"}
              </p>
            </div>

            {/* Where you can grow */}
            <h2 className="section-title">Where you can grow</h2>
            <div className="card">
              {d.progress.weakAreas.length === 0 ? (
                <p className="mb-0 muted">
                  Nothing flagged yet — keep practising and this list will help
                  you focus when something needs a little extra attention.
                </p>
              ) : (
                <ul className="win-list">
                  {d.progress.weakAreas.slice(0, 5).map((wa) => (
                    <li key={wa.id}>
                      <span aria-hidden="true">🌱</span>{' '}
                      {wa.reason || `A ${wa.kind} area to revisit`}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Skill detail — collapsed */}
            <h2 className="section-title">Skill details</h2>
            <div className="collapse">
              <button
                type="button"
                className="collapse__head"
                onClick={() => setShowSkills((s) => !s)}
              >
                {showSkills ? '▾' : '▸'} See your six skills
              </button>
              {showSkills && (
                <div className="collapse__body">
                  {skills.length === 0 ? (
                    <p className="mb-0 muted">
                      Your skill scores will appear here as you complete
                      activities and reviews.
                    </p>
                  ) : (
                    skills.map((s) => (
                      <div key={s.skill} className="skill-row">
                        <div className="skill-row__head">
                          <span>{SKILL_LABELS[s.skill] ?? s.skill}</span>
                          <span className="muted nowrap-num">
                            {Math.round(num(s.score) * 100)}%
                          </span>
                        </div>
                        <ProgressBar value={num(s.score)} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Weekly summary — feeds the Saturday review */}
            <h2 className="section-title">Resumen semanal</h2>
            <div className="card">
              <p className="mt-0 muted">
                Los últimos 7 días en texto plano: minutos, módulos, repasos y
                tarjetas. Listo para pegar en un chat.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void copyWeeklySummary()}
                disabled={copying}
              >
                {copying ? 'Copiando…' : 'Copiar resumen semanal'}
              </button>
              {copyMsg && (
                <p
                  className={
                    'form-msg ' + (copyMsg.ok ? 'form-msg--ok' : 'form-msg--err')
                  }
                >
                  {copyMsg.text}
                </p>
              )}
              {copyFallback && (
                <textarea
                  className="textarea"
                  readOnly
                  value={copyFallback}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Resumen semanal"
                />
              )}
            </div>

            <p className="faint mt-l">
              Want to keep the momentum?{' '}
              <Link to="/today">Go to today's session →</Link>
            </p>
          </>
        );
      }}
    </AsyncView>
  );
}
