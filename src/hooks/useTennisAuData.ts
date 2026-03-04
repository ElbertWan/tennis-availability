import { useState, useEffect } from "react";
import type { TennisAuResponse } from "@/types";
import { fetchTennisAuSessions } from "@/services/tennisAuService";

interface UseTennisAuDataResult {
  data: TennisAuResponse | null;
  loading: boolean;
  error: string | null;
}

export function useTennisAuData(slug: string, date: Date): UseTennisAuDataResult {
  const [data, setData] = useState<TennisAuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTennisAuSessions(slug, date)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, date]);

  return { data, loading, error };
}
