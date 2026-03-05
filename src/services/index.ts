import type { Venue, AvailabilityResult } from "@/types";
import { fetchTennisAuAvailability } from "./tennisAuService";
import { fetchHillsAvailability } from "./hillsService";
import { fetchTvAvailability } from "./tvService";

export { fetchTennisAuSessions, fetchTennisAuAvailability, fetchTennisAuAvailabilityRange } from "./tennisAuService";
export { fetchHillsVenueData, fetchHillsAvailability, fetchHillsAvailabilityRange, resolveOpeningHours, buildBookingsByCourtId } from "./hillsService";
export { parseTvHtml, fetchTvBookingData, fetchTvAvailability } from "./tvService";

export async function fetchAvailabilityForVenue(
  venue: Venue,
  dateStr: string
): Promise<AvailabilityResult[]> {
  switch (venue.source) {
    case "tennisAu":
      return fetchTennisAuAvailability(venue, dateStr);
    case "hills":
      return fetchHillsAvailability(venue, dateStr);
    case "tv":
      return fetchTvAvailability(venue, dateStr);
  }
}
