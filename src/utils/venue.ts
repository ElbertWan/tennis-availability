import type {
  Venue,
  ParsedSession,
  TennisAuRawSession,
  SlotInfo,
} from "@/types";
import React from "react";

export function parseSession(session: TennisAuRawSession): ParsedSession {
  return {
    name: session.Name,
    category: session.Category,
    startTime: session.StartTime,
    endTime: session.EndTime,
    capacity: session.Capacity,
    cost: session.CostFrom ?? session.Cost ?? 0,
    colour: session.Colour || null,
  };
}

export function getStatusForSlot(
  sessions: ParsedSession[],
  slotStart: number
): SlotInfo {
  for (const s of sessions) {
    if (slotStart >= s.startTime && slotStart < s.endTime) {
      if (s.category === 1000)
        return {
          status: "booked",
          label: s.name,
          colour: s.colour || "#fcfabd",
        };
      if (s.category === 0 && s.capacity > 0)
        return {
          status: "available",
          label: `$${s.cost.toFixed(2)}`,
          colour: null,
        };
      if (s.category === 2)
        return {
          status: "coaching",
          label: s.name,
          colour: s.colour || "#c3e6cb",
        };
      return {
        status: "session",
        label: s.name,
        colour: s.colour || "#d4edda",
      };
    }
  }
  return { status: "closed", label: "", colour: null };
}

export function tableStyle(
  numCourts: number
): React.CSSProperties | undefined {
  if (numCourts <= 4) return undefined;
  return { width: `calc(90px + ${numCourts} * ((100% - 90px) / 4))` };
}

export function groupBySuburb(venues: Venue[]): [string, Venue[]][] {
  const map = new Map<string, Venue[]>();
  for (const v of venues) {
    const suburb = v.suburb || "Other";
    if (!map.has(suburb)) map.set(suburb, []);
    map.get(suburb)!.push(v);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function getBookingUrl(venue: Venue, dateStr: string): string {
  switch (venue.source) {
    case "tennisAu":
      return `https://play.tennis.com.au/${venue.slug}/Booking/BookByDate#?date=${dateStr}&role=guest`;
    case "hills":
      return `https://hills.bookable.net.au/venues/${venue.venueId}/${venue.bookingSlug}?categoryId=4`;
    case "tv":
      return `https://www.tennisvenues.com.au/booking/${venue.clientId}?date=${dateStr.replace(/-/g, "")}`;
  }
}
