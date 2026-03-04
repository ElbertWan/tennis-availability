import { useState, useEffect } from "react";
import type { TvGridData } from "@/types";
import { fetchTvBookingData } from "@/services/tvService";

interface UseTvDataResult {
  gridData: TvGridData | null;
  loading: boolean;
  error: string | null;
}

export function useTvData(
  clientId: string,
  venueId: string,
  date: Date
): UseTvDataResult {
  const [gridData, setGridData] = useState<TvGridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTvBookingData(clientId, venueId, date)
      .then((parsed) => {
        if (!cancelled) setGridData(parsed);
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
  }, [clientId, venueId, date]);

  return { gridData, loading, error };
}
