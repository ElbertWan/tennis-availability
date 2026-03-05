import { useState, useCallback, useRef } from "react";
import type { Dayjs } from "dayjs";
import type { Venue, SearchResult, SearchProgress, AvailabilityResult } from "@/types";
import { fetchAvailabilityForVenue, fetchTennisAuAvailabilityRange, fetchHillsAvailabilityRange } from "@/services";
import { minutesToTime } from "@/utils/time";

interface UseAvailabilitySearchResult {
  searching: boolean;
  results: SearchResult[] | null;
  progress: SearchProgress;
  error: string | null;
  handleSearch: () => Promise<void>;
  cancelSearch: () => void;
  clearError: () => void;
}

export function useAvailabilitySearch(
  startTime: Dayjs,
  endTime: Dayjs,
  dateFrom: Dayjs,
  dateTo: Dayjs,
  searchVenues: Venue[]
): UseAvailabilitySearchResult {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [progress, setProgress] = useState<SearchProgress>({
    current: 0,
    total: 0,
    venue: "",
  });
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const handleSearch = useCallback(async () => {
    cancelledRef.current = false;
    setSearching(true);
    setResults(null);
    setError(null);

    const startMins = startTime.hour() * 60 + startTime.minute();
    const endMins = endTime.hour() * 60 + endTime.minute();

    if (endMins <= startMins) {
      setError("End time must be after start time.");
      setSearching(false);
      return;
    }
    if (!searchVenues.length) {
      setError("Please select at least one venue.");
      setSearching(false);
      return;
    }
    if (dateTo.isBefore(dateFrom)) {
      setError("End date must be on or after start date.");
      setSearching(false);
      return;
    }

    const days: Dayjs[] = [];
    let cursor = dateFrom.startOf("day");
    const end = dateTo.startOf("day");
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      days.push(cursor);
      cursor = cursor.add(1, "day");
    }

    const rangeVenues = searchVenues.filter(
      (v) => v.source === "tennisAu" || v.source === "hills"
    );
    const perDayVenues = searchVenues.filter(
      (v) => v.source !== "tennisAu" && v.source !== "hills"
    );

    const totalSteps =
      rangeVenues.length + days.length * perDayVenues.length;
    setProgress({ current: 0, total: totalSteps, venue: "" });

    const found: SearchResult[] = [];
    let step = 0;

    const requiredSlots: number[] = [];
    for (let t = startMins; t < endMins; t += 30) requiredSlots.push(t);

    const collectResults = (
      slots: AvailabilityResult[],
      venue: Venue,
      dateStr: string
    ) => {
      const dateNative = new Date(dateStr + "T00:00:00");
      const slotsByCourt = new Map<string, Map<number, (typeof slots)[number]>>();
      for (const s of slots) {
        if (s.time === null || s.time === undefined) continue;
        if (s.time < startMins || s.time >= endMins) continue;
        if (!slotsByCourt.has(s.court))
          slotsByCourt.set(s.court, new Map());
        slotsByCourt.get(s.court)!.set(s.time, s);
      }
      for (const [court, courtSlotMap] of slotsByCourt) {
        const hasAll = requiredSlots.every((t) => courtSlotMap.has(t));
        if (hasAll) {
          const firstSlot = courtSlotMap.get(requiredSlots[0]!)!;
          found.push({
            venue,
            date: dateNative,
            dateStr,
            time: firstSlot.time,
            timeLabel:
              firstSlot.timeLabel || minutesToTime(firstSlot.time!),
            court,
            cost: firstSlot.cost,
            totalAvailable: requiredSlots.length,
          });
        }
      }
    };

    const startDateStr = dateFrom.format("YYYY-MM-DD");
    const endDateStr = dateTo.format("YYYY-MM-DD");

    // Range-capable venues: single call per venue for the full date range
    for (const venue of rangeVenues) {
      if (cancelledRef.current) { setSearching(false); return; }
      step++;
      setProgress({ current: step, total: totalSteps, venue: venue.name });
      try {
        const rangeMap =
          venue.source === "tennisAu"
            ? await fetchTennisAuAvailabilityRange(venue, startDateStr, endDateStr)
            : await fetchHillsAvailabilityRange(venue, startDateStr, endDateStr);
        for (const [dateStr, slots] of rangeMap) {
          collectResults(slots, venue, dateStr);
        }
      } catch {
        // skip venues that fail
      }
    }

    // Other venues: one call per venue per day
    for (const day of days) {
      const dateStr = day.format("YYYY-MM-DD");
      for (const venue of perDayVenues) {
        if (cancelledRef.current) { setSearching(false); return; }
        step++;
        setProgress({ current: step, total: totalSteps, venue: venue.name });
        try {
          const slots = await fetchAvailabilityForVenue(venue, dateStr);
          collectResults(slots, venue, dateStr);
        } catch {
          // skip venues that fail
        }
      }
    }

    if (!cancelledRef.current) {
      setResults(found);
      setSearching(false);
    }
  }, [startTime, endTime, dateFrom, dateTo, searchVenues]);

  const cancelSearch = useCallback(() => {
    cancelledRef.current = true;
    setSearching(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    searching,
    results,
    progress,
    error,
    handleSearch,
    cancelSearch,
    clearError,
  };
}
