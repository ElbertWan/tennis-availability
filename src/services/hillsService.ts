import { HILLS_API } from "@/constants";
import type {
  HillsVenue,
  HillsCourt,
  HillsBooking,
  HillsOpeningHours,
  HillsBookingRange,
  AvailabilityResult,
} from "@/types";
import { formatDate, timeToMinutes } from "@/utils/time";

interface HillsVenueData {
  courts: HillsCourt[];
  bookings: HillsBooking[];
  hours: HillsOpeningHours[];
}

export async function fetchHillsVenueData(
  venueId: number,
  date: Date
): Promise<HillsVenueData> {
  const dateStr = formatDate(date);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = formatDate(nextDate);

  const [courtsData, bookingsData, hoursData] = await Promise.all([
    fetch(`${HILLS_API}/venues/${venueId}/bookables`, {
      headers: { Accept: "application/json" },
    }).then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))),
    fetch(
      `${HILLS_API}/venues/${venueId}/bookingbookablesinperiod?fromDate=${dateStr}&toDate=${nextDateStr}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`,
      { headers: { Accept: "application/json" } }
    ).then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))),
    fetch(`${HILLS_API}/venues/${venueId}/getbaseopeninghourslist`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  return {
    courts: (courtsData as HillsCourt[]).filter(
      (b) => b.Name?.includes("Tennis") || b.Name?.includes("Court")
    ),
    bookings: bookingsData as HillsBooking[],
    hours: hoursData as HillsOpeningHours[],
  };
}

export function resolveOpeningHours(
  hours: HillsOpeningHours[],
  date: Date
): { openMinutes: number; closeMinutes: number } {
  let openMinutes = 7 * 60;
  let closeMinutes = 22 * 60;

  if (hours.length) {
    const dayHours = hours.find(
      (h) => (h.DayOfWeek ?? h.dayOfWeek) === date.getDay()
    );
    if (dayHours) {
      const open = dayHours.OpenTime || dayHours.openTime;
      const close = dayHours.CloseTime || dayHours.closeTime;
      if (open) {
        const p = open.split(":");
        openMinutes = parseInt(p[0]!) * 60 + parseInt(p[1] || "0");
      }
      if (close) {
        const p = close.split(":");
        closeMinutes = parseInt(p[0]!) * 60 + parseInt(p[1] || "0");
      }
    }
  }

  return { openMinutes, closeMinutes };
}

export function buildBookingsByCourtId(
  bookings: HillsBooking[],
  dateStr: string
): Record<number, HillsBookingRange[]> {
  const dayBookings = bookings.filter((b) => b.Start_Date?.startsWith(dateStr));
  const result: Record<number, HillsBookingRange[]> = {};

  for (const b of dayBookings) {
    if (!result[b.ItemID]) result[b.ItemID] = [];
    result[b.ItemID]!.push({
      start: timeToMinutes(b.Start_Date),
      end: timeToMinutes(b.End_Date),
    });
  }

  return result;
}

export async function fetchHillsAvailability(
  venue: HillsVenue,
  dateStr: string
): Promise<AvailabilityResult[]> {
  const date = new Date(dateStr + "T00:00:00");
  const { courts, bookings, hours } = await fetchHillsVenueData(
    venue.venueId,
    date
  );
  if (!courts.length) return [];

  const { openMinutes, closeMinutes } = resolveOpeningHours(hours, date);
  const bookingsByCourtId = buildBookingsByCourtId(bookings, dateStr);

  const interval = 30;
  const results: AvailabilityResult[] = [];

  for (const court of courts) {
    for (let t = openMinutes; t < closeMinutes; t += interval) {
      const isBooked = (bookingsByCourtId[court.ItemID] || []).some(
        (b) => t >= b.start && t < b.end
      );
      if (!isBooked) {
        const rate = court.HourlyRate || 21;
        results.push({
          time: t,
          court: court.Name,
          cost: `$${((rate * interval) / 60).toFixed(2)}`,
        });
      }
    }
  }
  return results;
}
