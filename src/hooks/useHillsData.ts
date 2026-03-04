import { useState, useEffect } from "react";
import type { HillsCourt, HillsBooking, HillsOpeningHours } from "@/types";
import { fetchHillsVenueData } from "@/services/hillsService";

interface UseHillsDataResult {
  courts: HillsCourt[] | null;
  bookings: HillsBooking[] | null;
  hours: HillsOpeningHours[] | null;
  loading: boolean;
  error: string | null;
}

export function useHillsData(venueId: number, date: Date): UseHillsDataResult {
  const [courts, setCourts] = useState<HillsCourt[] | null>(null);
  const [bookings, setBookings] = useState<HillsBooking[] | null>(null);
  const [hours, setHours] = useState<HillsOpeningHours[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHillsVenueData(venueId, date)
      .then(({ courts: c, bookings: b, hours: h }) => {
        if (cancelled) return;
        setCourts(c);
        setBookings(b);
        setHours(h);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [venueId, date]);

  return { courts, bookings, hours, loading, error };
}
