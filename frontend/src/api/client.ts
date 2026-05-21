// Tiny typed fetch wrapper. Normalises every failure into a friendly ApiError
// so screens can show calm copy instead of stack traces.

export type ApiErrorKind =
  | 'offline' // could not reach the local server at all
  | 'vault_unset' // 503 — vault path not configured yet
  | 'not_found' // 404
  | 'bad_request' // 400 / 422
  | 'server' // 500
  | 'unknown';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number;
  detail: string;

  constructor(kind: ApiErrorKind, status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

/** Human-friendly headline for any ApiError. Used by the shared error state. */
export function friendlyError(err: unknown): { title: string; message: string } {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case 'offline':
        return {
          title: "Can't reach the app",
          message:
            "I can't reach the local server yet. Make sure the app is still running (npm run dev), then try again.",
        };
      case 'vault_unset':
        return {
          title: 'Your Dutch content is not connected',
          message:
            "I don't see your Dutch vault yet. Add the vault folder path in Settings and we'll get going.",
        };
      case 'not_found':
        return {
          title: 'Not found',
          message: "We couldn't find what you were looking for. It may have moved.",
        };
      case 'server':
        return {
          title: 'Something went wrong',
          message: "The app's engine hit a snag. Try again in a moment — your progress is safe.",
        };
      default:
        return {
          title: 'Something went wrong',
          message: err.detail || 'Please try again in a moment.',
        };
    }
  }
  return {
    title: 'Something went wrong',
    message: 'Please try again in a moment.',
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('offline', 0, 'Could not reach the local server.');
  }

  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // Our backend always answers with a JSON problem document. A non-object
    // body therefore means the request never reached the backend — typically
    // the dev proxy could not connect because the backend isn't running.
    const isJsonBody = data !== null && typeof data === 'object';
    const d = (isJsonBody ? data : {}) as Record<string, unknown>;
    const detail =
      (typeof d.detail === 'string' && d.detail) ||
      (typeof d.title === 'string' && d.title) ||
      `Request failed (${res.status})`;

    if (res.status === 503 && d.error === 'vault_path_unset') {
      throw new ApiError('vault_unset', 503, detail);
    }
    if (res.status === 404) throw new ApiError('not_found', 404, detail);
    if (res.status === 400 || res.status === 422) {
      throw new ApiError('bad_request', res.status, detail);
    }
    if (res.status >= 500) {
      if (!isJsonBody) {
        throw new ApiError(
          'offline',
          res.status,
          'The local server did not respond.',
        );
      }
      throw new ApiError('server', res.status, detail);
    }
    throw new ApiError('unknown', res.status, detail);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
};
