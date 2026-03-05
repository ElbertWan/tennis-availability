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
  const map = await fetchHillsAvailabilityRange(venue, dateStr, dateStr);
  return map.get(dateStr) || [];
}

/**
 * Fetch availability for a Hills venue across a date range in a single set of
 * API calls. Returns a Map keyed by "YYYY-MM-DD" date string.
 */
export async function fetchHillsAvailabilityRange(
  venue: HillsVenue,
  startDate: string,
  endDate: string
): Promise<Map<string, AvailabilityResult[]>> {
  const fromDate = new Date(startDate + "T00:00:00");
  const toDate = new Date(endDate + "T00:00:00");
  const toDatePlusOne = new Date(toDate);
  toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);

  const [courtsData, bookingsData, hoursData] = await Promise.all([
    fetch(`${HILLS_API}/venues/${venue.venueId}/bookables`, {
      headers: { Accept: "application/json" },
    }).then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))),
    fetch(
      `${HILLS_API}/venues/${venue.venueId}/bookingbookablesinperiod?fromDate=${startDate}&toDate=${formatDate(toDatePlusOne)}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`,
      { headers: { Accept: "application/json" } }
    ).then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))),
    fetch(`${HILLS_API}/venues/${venue.venueId}/getbaseopeninghourslist`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  const courts = (courtsData as HillsCourt[]).filter(
    (b) => b.Name?.includes("Tennis") || b.Name?.includes("Court")
  );
  const bookings = bookingsData as HillsBooking[];
  const hours = hoursData as HillsOpeningHours[];

  const resultMap = new Map<string, AvailabilityResult[]>();
  if (!courts.length) return resultMap;

  const interval = 30;
  let cursor = new Date(fromDate);
  while (cursor <= toDate) {
    const dateStr = formatDate(cursor);
    const { openMinutes, closeMinutes } = resolveOpeningHours(hours, cursor);
    const bookingsByCourtId = buildBookingsByCourtId(bookings, dateStr);

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
    resultMap.set(dateStr, results);

    cursor.setDate(cursor.getDate() + 1);
  }

  return resultMap;
}
