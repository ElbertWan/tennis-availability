import { memo, useCallback, useMemo } from "react";
import type { HillsVenue, SlotInfo, HillsBookingRange } from "@/types";
import { useHillsData } from "@/hooks/useHillsData";
import { formatDate } from "@/utils/time";
import {
  resolveOpeningHours,
  buildBookingsByCourtId,
} from "@/services/hillsService";
import { AvailabilityGrid } from "./AvailabilityGrid";

interface HillsVenueGridProps {
  venue: HillsVenue;
  date: Date;
}

export const HillsVenueGrid = memo(function HillsVenueGrid({
  venue,
  date,
}: HillsVenueGridProps) {
  const { courts, bookings, hours, loading, error } = useHillsData(
    venue.venueId,
    date
  );

  const dateStr = formatDate(date);

  const { openMinutes, closeMinutes } = useMemo(
    () => resolveOpeningHours(hours || [], date),
    [hours, date]
  );

  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    for (let t = openMinutes; t < closeMinutes; t += 30) slots.push(t);
    return slots;
  }, [openMinutes, closeMinutes]);

  const columns = useMemo(
    () => (courts || []).map((c) => ({ id: c.ItemID, name: c.Name })),
    [courts]
  );

  const bookingsByCourtId = useMemo(
    () => buildBookingsByCourtId(bookings || [], dateStr),
    [bookings, dateStr]
  );

  const interval = 30;

  const getSlotInfo = useCallback(
    (columnId: string | number, slotStart: number): SlotInfo => {
      const courtBookings: HillsBookingRange[] =
        bookingsByCourtId[columnId as number] || [];
      for (const b of courtBookings) {
        if (slotStart >= b.start && slotStart < b.end) {
          return { status: "booked", label: "Booked", colour: null };
        }
      }
      const court = courts?.find((c) => c.ItemID === columnId);
      const rate = court?.HourlyRate || 21;
      return {
        status: "available",
        label: `$${((rate * interval) / 60).toFixed(2)}`,
        colour: null,
      };
    },
    [bookingsByCourtId, courts]
  );

  if (loading)
    return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error)
    return (
      <div className="venue-error">
        {venue.name}: {error}
      </div>
    );
  if (!courts?.length)
    return <div className="venue-error">{venue.name}: No courts found</div>;

  const bookingUrl = `https://hills.bookable.net.au/venues/${venue.venueId}/${venue.bookingSlug}?categoryId=4`;

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
