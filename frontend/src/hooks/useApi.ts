import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

/**
 * Generic data-loading hook. Pass a fetcher and a deps array.
 * Returns { data, error, loading, reload }.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  // Keep the latest fetcher without making it a dependency.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const apiErr =
            err instanceof ApiError
              ? err
              : new ApiError('unknown', 0, 'Unexpected error');
          setState({ data: null, error: apiErr, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    const cancel = run();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reloadTick]);

  return { ...state, reload };
}
