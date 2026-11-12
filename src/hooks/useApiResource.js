import { useCallback, useEffect, useMemo, useState } from "react";
import { StaleSessionError } from "../services/apiClient.js";

export function useApiResource(load, scope = null) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState(null);
  const request = useMemo(
    () => ({ load, scope, reloadKey }),
    [load, scope, reloadKey],
  );

  useEffect(() => {
    const controller = new AbortController();

    request.load(controller.signal).then(
      (data) => setResult({ request, status: "success", data, error: "" }),
      (error) => {
        if (error?.name === "AbortError" || error instanceof StaleSessionError) return;
        setResult({
          request,
          status: "error",
          data: null,
          error: error?.message || "Something went wrong.",
        });
      },
    );

    return () => controller.abort();
  }, [request]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const settled = result?.request === request ? result : null;

  return {
    status: settled?.status ?? "loading",
    data: settled?.data ?? null,
    error: settled?.error ?? "",
    reload,
  };
}
