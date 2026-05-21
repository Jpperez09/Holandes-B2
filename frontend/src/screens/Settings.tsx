import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type {
  DbHealthResponse,
  HealthResponse,
  SettingsMap,
  VaultSnapshot,
  VaultWarningsResponse,
} from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView } from '../components/ui';

interface SettingsData {
  settings: SettingsMap;
  health: HealthResponse | null;
  dbHealth: DbHealthResponse | null;
  snapshot: VaultSnapshot | null;
  warnings: VaultWarningsResponse | null;
}

async function loadSettings(): Promise<SettingsData> {
  const settings = await endpoints.getSettings(); // required
  const [health, dbHealth, snapshot, warnings] = await Promise.all([
    endpoints.health().catch(() => null),
    endpoints.dbHealth().catch(() => null),
    endpoints.getVaultSnapshot().catch(() => null),
    endpoints.getVaultWarnings().catch(() => null),
  ]);
  return { settings, health, dbHealth, snapshot, warnings };
}

const GOAL_OPTIONS = [15, 30, 45, 60, 90];
const LEVEL_OPTIONS = [
  { label: 'A1 — basic phrases', value: 20 },
  { label: 'A2 — everyday survival', value: 40 },
  { label: 'B1 — independent user', value: 70 },
  { label: 'B2 — confident user', value: 100 },
];
const GITHUB_URL = 'https://github.com/Jpperez09/Holandes-B2';

export function Settings(): React.JSX.Element {
  const { data, error, loading, reload } = useApi(loadSettings, []);
  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(d) => <SettingsForm data={d} onChanged={reload} />}
    </AsyncView>
  );
}

function SettingsForm({
  data,
  onChanged,
}: {
  data: SettingsData;
  onChanged: () => void;
}): React.JSX.Element {
  const { settings, health, dbHealth, snapshot, warnings } = data;

  const [name, setName] = useState(settings['user_name'] ?? '');
  const [goal, setGoal] = useState(settings['daily_goal_minutes'] ?? '60');
  const [target, setTarget] = useState(settings['target_level'] ?? '100');
  const [vaultPath, setVaultPath] = useState(settings['vault_path'] ?? '');

  const [savingMain, setSavingMain] = useState(false);
  const [mainMsg, setMainMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [savingVault, setSavingVault] = useState(false);
  const [vaultMsg, setVaultMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [reindexing, setReindexing] = useState(false);
  const [techOpen, setTechOpen] = useState(false);

  async function saveMain(): Promise<void> {
    setSavingMain(true);
    setMainMsg(null);
    try {
      await endpoints.updateSettings({
        user_name: name.trim() || 'Juanpa',
        daily_goal_minutes: goal,
        target_level: target,
      });
      setMainMsg({ ok: true, text: 'Saved 👍' });
      onChanged();
    } catch (err) {
      setMainMsg({ ok: false, text: friendlyMsg(err) });
    } finally {
      setSavingMain(false);
    }
  }

  async function saveVault(): Promise<void> {
    setSavingVault(true);
    setVaultMsg(null);
    try {
      await endpoints.updateSettings({ vault_path: vaultPath.trim() });
      setVaultMsg({
        ok: true,
        text: 'Vault folder saved — your content is being re-scanned.',
      });
      onChanged();
    } catch (err) {
      setVaultMsg({ ok: false, text: friendlyMsg(err) });
    } finally {
      setSavingVault(false);
    }
  }

  async function reindex(): Promise<void> {
    setReindexing(true);
    setVaultMsg(null);
    try {
      await endpoints.reindexVault();
      setVaultMsg({ ok: true, text: 'Re-scan complete.' });
      onChanged();
    } catch (err) {
      setVaultMsg({ ok: false, text: friendlyMsg(err) });
    } finally {
      setReindexing(false);
    }
  }

  // --- App health summary ---
  const backendOk = health?.ok === true;
  const dbOk = dbHealth?.ok === true;
  const vaultReady = snapshot?.indexerState?.ready !== false && !!snapshot;
  const allOk = backendOk && dbOk && vaultReady;
  const warningCount = warnings?.warnings.length ?? 0;

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Your details and a quick health check.</p>

      {/* Your details */}
      <h2 className="section-title mt-0">Your details</h2>
      <div className="card">
        <div className="field">
          <label htmlFor="set-name">Your name</label>
          <input
            id="set-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="field">
          <label htmlFor="set-goal">Daily study goal</label>
          <select
            id="set-goal"
            className="select"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            {GOAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} minutes a day
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="set-target">Your goal</label>
          <select
            id="set-target"
            className="select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {!LEVEL_OPTIONS.some((o) => String(o.value) === target) && (
              <option value={target}>Level {target}</option>
            )}
          </select>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void saveMain()}
          disabled={savingMain}
        >
          {savingMain ? 'Saving…' : 'Save'}
        </button>
        {mainMsg && (
          <p
            className={
              'form-msg ' + (mainMsg.ok ? 'form-msg--ok' : 'form-msg--err')
            }
          >
            {mainMsg.text}
          </p>
        )}
      </div>

      {/* App health */}
      <h2 className="section-title">App health</h2>
      <div className="card">
        <p className="mt-0">
          <span
            className={
              'health-dot ' + (allOk ? 'health-dot--ok' : 'health-dot--wait')
            }
          />
          <strong>
            {allOk
              ? 'Everything is working'
              : 'Something needs attention'}
          </strong>
        </p>
        <p className="mb-0 muted">
          {allOk
            ? 'Your app, your saved progress and your Dutch content are all connected.'
            : 'One part of the app needs a look — open the technical details below.'}
        </p>
        {warningCount > 0 && (
          <p className="mb-0 faint mt-s">
            {warningCount} content note{warningCount === 1 ? '' : 's'} from the
            last scan — see technical details.
          </p>
        )}
      </div>

      {/* Technical section */}
      <h2 className="section-title">For technical users</h2>
      <div className="collapse">
        <button
          type="button"
          className="collapse__head"
          onClick={() => setTechOpen((o) => !o)}
        >
          {techOpen ? '▾' : '▸'} Show technical details
        </button>
        {techOpen && (
          <div className="collapse__body">
            {/* Vault path */}
            <div className="field">
              <label htmlFor="set-vault">
                Vault folder path{' '}
                <span className="hint">
                  (the folder with your Dutch curriculum)
                </span>
              </label>
              <input
                id="set-vault"
                className="input"
                value={vaultPath}
                onChange={(e) => setVaultPath(e.target.value)}
                placeholder="D:\Obsidian\Juanpa-Holandes-B2"
              />
            </div>
            <div className="row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void saveVault()}
                disabled={savingVault}
              >
                {savingVault ? 'Saving…' : 'Save vault folder'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void reindex()}
                disabled={reindexing}
              >
                {reindexing ? 'Re-scanning…' : 'Re-scan vault for content'}
              </button>
            </div>
            {vaultMsg && (
              <p
                className={
                  'form-msg ' +
                  (vaultMsg.ok ? 'form-msg--ok' : 'form-msg--err')
                }
              >
                {vaultMsg.text}
              </p>
            )}

            <hr className="md" style={{ margin: '18px 0' }} />

            {/* Status rows */}
            <p className="mb-0">
              <span
                className={
                  'health-dot ' +
                  (backendOk ? 'health-dot--ok' : 'health-dot--bad')
                }
              />
              Backend server:{' '}
              {backendOk ? 'running (localhost:8787)' : 'not reachable'}
            </p>
            <p className="mb-0 mt-s">
              <span
                className={
                  'health-dot ' + (dbOk ? 'health-dot--ok' : 'health-dot--bad')
                }
              />
              Database (progress.sqlite):{' '}
              {dbOk ? `OK — ${dbHealth?.integrity}` : 'check failed'}
            </p>
            {snapshot && (
              <p className="mb-0 mt-s">
                <span className="health-dot health-dot--ok" />
                Vault content: {snapshot.counts.modules} modules,{' '}
                {snapshot.counts.vocabulary} words,{' '}
                {snapshot.counts.grammar_patterns} grammar patterns indexed
              </p>
            )}

            {/* Parser warnings */}
            <div className="mt-m">
              <strong>Parser notices</strong>
              {warningCount === 0 ? (
                <p className="mb-0 muted mt-s">
                  No problems found in your vault content. 🎉
                </p>
              ) : (
                <ul className="mt-s">
                  {warnings?.warnings.slice(0, 15).map((w, i) => (
                    <li key={i} className="muted">
                      <strong>{w.severity}:</strong> {w.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-m mb-0">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                Project repository on GitHub ↗
              </a>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function friendlyMsg(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.kind === 'bad_request') return err.detail;
    if (err.kind === 'offline') {
      return "Can't reach the app — make sure it's still running.";
    }
  }
  return "That didn't save — please try again.";
}
