import { TENNIS_AU_API } from "@/constants";
import type {
  TennisAuVenue,
  TennisAuResponse,
  AvailabilityResult,
} from "@/types";
import { formatDate } from "@/utils/time";
import { parseSession, getStatusForSlot } from "@/utils/venue";

export async function fetchTennisAuSessions(
  slug: string,
  date: Date
): Promise<TennisAuResponse | null> {
  const dateStr = formatDate(date);
  const r = await fetch(
    `${TENNIS_AU_API}/${slug}/GetVenueSessions?resourceID=&startDate=${dateStr}&endDate=${dateStr}&roleId=&_=${Date.now()}`
  );
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchTennisAuAvailability(
  venue: TennisAuVenue,
  dateStr: string
): Promise<AvailabilityResult[]> {
  const map = await fetchTennisAuAvailabilityRange(venue, dateStr, dateStr);
  return map.get(dateStr) || [];
}

/**
 * Fetch availability for a Tennis AU venue across a date range in a single API
 * call. Returns a Map keyed by "YYYY-MM-DD" date string.
 */
export async function fetchTennisAuAvailabilityRange(
  venue: TennisAuVenue,
  startDate: string,
  endDate: string
): Promise<Map<string, AvailabilityResult[]>> {
  const r = await fetch(
    `${TENNIS_AU_API}/${venue.slug}/GetVenueSessions?resourceID=&startDate=${startDate}&endDate=${endDate}&roleId=&_=${Date.now()}`
  );
  const resultMap = new Map<string, AvailabilityResult[]>();
  if (!r.ok) return resultMap;
  const json: TennisAuResponse = await r.json();
  if (!json?.Resources?.length) return resultMap;

  const interval = json.MinimumInterval || 30;

  const dayCount = daysBetween(startDate, endDate);

  for (const resource of json.Resources) {
    const days = resource.Days || [];
    for (let di = 0; di < days.length && di <= dayCount; di++) {
      const dateStr = addDays(startDate, di);
      const sessions = (days[di]!.Sessions || []).map(parseSession);

      if (!resultMap.has(dateStr)) resultMap.set(dateStr, []);
      const results = resultMap.get(dateStr)!;

      for (
        let t = json.EarliestStartTime;
        t < json.LatestEndTime;
        t += interval
      ) {
        const info = getStatusForSlot(sessions, t);
        if (info.status === "available") {
          results.push({ time: t, court: resource.Name, cost: info.label });
        }
      }
    }
  }
  return resultMap;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
