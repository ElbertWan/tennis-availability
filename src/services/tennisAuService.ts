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
  const r = await fetch(
    `${TENNIS_AU_API}/${venue.slug}/GetVenueSessions?resourceID=&startDate=${dateStr}&endDate=${dateStr}&roleId=&_=${Date.now()}`
  );
  if (!r.ok) return [];
  const json: TennisAuResponse = await r.json();
  if (!json?.Resources?.length) return [];

  const interval = json.MinimumInterval || 30;
  const results: AvailabilityResult[] = [];

  for (const resource of json.Resources) {
    const sessions = (resource.Days?.[0]?.Sessions || []).map(parseSession);
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
  return results;
}
