import React from 'react';
import { Link } from 'react-router-dom';
import { ApiError, friendlyError } from '../api/client';

/** Loading spinner state. */
export function Loading({ label = 'Loading…' }: { label?: string }): React.JSX.Element {
  return (
    <div className="state">
      <div className="spinner" />
      <p className="state__msg" style={{ marginTop: 16 }}>
        {label}
      </p>
    </div>
  );
}

/** Friendly error state. Knows how to send the user to Settings when the vault is unset. */
export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry?: () => void;
}): React.JSX.Element {
  const { title, message } = friendlyError(error);
  const isVault = error.kind === 'vault_unset';
  return (
    <div className="state">
      <div className="state__icon">{isVault ? '📂' : error.kind === 'offline' ? '🔌' : '😕'}</div>
      <p className="state__title">{title}</p>
      <p className="state__msg">{message}</p>
      <div className="state__action">
        {isVault ? (
          <Link className="btn btn--primary" to="/settings">
            Open Settings
          </Link>
        ) : (
          onRetry && (
            <button className="btn btn--ghost" onClick={onRetry}>
              Try again
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** Calm empty state — never a blank screen. */
export function EmptyState({
  icon = '🌱',
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="state">
      <div className="state__icon">{icon}</div>
      <p className="state__title">{title}</p>
      {message && <p className="state__msg">{message}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  );
}

/** Slim progress bar. */
export function ProgressBar({
  value,
  variant = 'primary',
}: {
  value: number; // 0..1
  variant?: 'primary' | 'done' | 'accent';
}): React.JSX.Element {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const cls =
    variant === 'done'
      ? 'bar__fill bar__fill--done'
      : variant === 'accent'
        ? 'bar__fill bar__fill--accent'
        : 'bar__fill';
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)}>
      <div className={cls} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Standard async wrapper: shows loading / error / content.
 * `data` may legitimately be falsy (e.g. 0), so we gate on loading+error only.
 */
export function AsyncView<T>({
  loading,
  error,
  data,
  onRetry,
  children,
}: {
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}): React.JSX.Element {
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (data === null || data === undefined) {
    return <EmptyState icon="🤔" title="Nothing here yet" />;
  }
  return <>{children(data)}</>;
}
