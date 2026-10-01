import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api";

// GETs `path` and tracks loading / error state.
//   const { data, error, loading, reload } = useApi("/gigs");
// Pass { enabled: false } to skip the request (e.g. wrong role).
// While a new request is in flight the previous data stays available, so
// lists don't flash empty when filters change.
export function useApi(path, { enabled = true } = {}) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const key = `${path}#${tick}`;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    apiFetch(path)
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, data: null, error: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [path, key, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    data: enabled ? result.data : null,
    error: enabled && result.key === key ? result.error : "",
    loading: enabled && result.key !== key,
    reload,
  };
}
