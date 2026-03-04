import { memo, useCallback, useMemo } from "react";
import type { TennisAuVenue, SlotInfo } from "@/types";
import { useTennisAuData } from "@/hooks/useTennisAuData";
import { formatDate } from "@/utils/time";
import { parseSession, getStatusForSlot } from "@/utils/venue";
import { AvailabilityGrid } from "./AvailabilityGrid";

interface TennisAuGridProps {
  venue: TennisAuVenue;
  date: Date;
}

export const TennisAuGrid = memo(function TennisAuGrid({
  venue,
  date,
}: TennisAuGridProps) {
  const { data, loading, error } = useTennisAuData(venue.slug, date);

  const timeSlots = useMemo(() => {
    if (!data) return [];
    const slots: number[] = [];
    const interval = data.MinimumInterval || 30;
    for (let t = data.EarliestStartTime; t < data.LatestEndTime; t += interval) {
      slots.push(t);
    }
    return slots;
  }, [data]);

  const columns = useMemo(
    () => (data?.Resources || []).map((r) => ({ id: r.ID, name: r.Name })),
    [data]
  );

  const sessionsByResourceId = useMemo(() => {
    if (!data) return new Map<number, ReturnType<typeof parseSession>[]>();
    const map = new Map<number, ReturnType<typeof parseSession>[]>();
    for (const r of data.Resources) {
      map.set(r.ID, (r.Days?.[0]?.Sessions || []).map(parseSession));
    }
    return map;
  }, [data]);

  const getSlotInfo = useCallback(
    (columnId: string | number, slotStart: number): SlotInfo => {
      const sessions = sessionsByResourceId.get(columnId as number) || [];
      return getStatusForSlot(sessions, slotStart);
    },
    [sessionsByResourceId]
  );

  if (loading)
    return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error)
    return (
      <div className="venue-error">
        {venue.name}: {error}
      </div>
    );
  if (!data?.Resources?.length)
    return <div className="venue-error">{venue.name}: No data available</div>;

  const dateStr = formatDate(date);
  const bookingUrl = `https://play.tennis.com.au/${venue.slug}/Booking/BookByDate#?date=${dateStr}&role=guest`;

  return (
    <AvailabilityGrid
      venueName={venue.name}
      bookingUrl={bookingUrl}
      columns={columns}
      timeSlots={timeSlots}
      getSlotInfo={getSlotInfo}
    />
  );
});
