import React, { useState } from 'react';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';

/**
 * First-run wizard. Shown by App when no vault path is configured yet.
 * Collects the user's name and vault folder, then waits for the backend
 * to index the curriculum before handing control back to the app.
 */
export function Onboarding({
  onComplete,
}: {
  onComplete: () => void;
}): React.JSX.Element {
  const [name, setName] = useState('');
  const [vaultPath, setVaultPath] = useState('');
  const [phase, setPhase] = useState<'form' | 'indexing'>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!vaultPath.trim()) {
      setError('Please enter the folder where your Dutch lessons live.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await endpoints.updateSettings({
        user_name: name.trim() || 'Friend',
        vault_path: vaultPath.trim(),
      });
      // Path accepted — the backend is now indexing the vault.
      // Wait until lessons are ready so the app opens to a usable state.
      setPhase('indexing');
      await waitForLessons();
      onComplete();
    } catch (err) {
      setPhase('form');
      if (err instanceof ApiError && err.kind === 'bad_request') {
        setError(err.detail); // friendly backend message, e.g. folder not found
      } else if (err instanceof ApiError && err.kind === 'offline') {
        setError("Can't reach the app — make sure it's still running.");
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        {phase === 'indexing' ? (
          <div className="center">
            <div className="spinner" />
            <p className="section-title">Setting up your lessons…</p>
            <p className="muted mb-0">This takes just a moment.</p>
          </div>
        ) : (
          <>
            <div className="onboarding__emoji">🌱</div>
            <h1 className="onboarding__title">Welcome to your Dutch app</h1>
            <p className="muted mt-0">
              Two quick things and you're ready to start learning. Everything
              stays on your computer — no account, no sign-up.
            </p>

            <div className="onboarding__step">
              <div className="field">
                <label htmlFor="ob-name">What should we call you?</label>
                <input
                  id="ob-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="field">
                <label htmlFor="ob-vault">
                  Your Dutch lessons folder{' '}
                  <span className="hint">
                    — the folder with your curriculum (someone shared it with
                    you, e.g. <code>D:\Obsidian\Juanpa-Holandes-B2</code>)
                  </span>
                </label>
                <input
                  id="ob-vault"
                  className="input"
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  placeholder="Paste the full folder path here"
                />
              </div>

              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => void submit()}
                disabled={busy}
              >
                {busy ? 'Checking…' : 'Start learning →'}
              </button>

              {error && <p className="form-msg form-msg--err">{error}</p>}
            </div>

            <p className="faint mt-l mb-0">
              You can change these any time in Settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** Poll until the backend has indexed at least one module (or give up). */
async function waitForLessons(): Promise<void> {
  for (let i = 0; i < 24; i++) {
    try {
      const modules = await endpoints.getModules();
      if (modules.length > 0) return;
    } catch {
      /* vault still indexing or briefly unavailable — keep waiting */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  // Gave up waiting; the app's own loading/empty states take over.
}
