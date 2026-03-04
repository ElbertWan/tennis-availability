import { TV_API } from "@/constants";
import type { TvVenue, TvGridData, TvSlotCell, AvailabilityResult } from "@/types";

export function parseTvHtml(html: string): TvGridData | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table.BookingSheet");
  if (!table) return null;

  const headerCells = table.querySelectorAll(
    "thead td.BookingSheetCategoryLabel"
  );
  const courtNames = [...headerCells].map((td) => td.textContent?.trim() ?? "");

  const rows = table.querySelectorAll("tbody tr");
  const slots: TvGridData["slots"] = [];
  let currentHourLabel = "";

  for (const row of rows) {
    const labelCell = row.querySelector("td.BookingSheetTimeLabel");
    const timeCells = row.querySelectorAll("td.TimeCell");
    if (!timeCells.length) continue;

    const labelText = labelCell?.textContent?.trim() || "";
    if (labelText && labelText !== "\u00a0") currentHourLabel = labelText;

    const cells: TvSlotCell[] = [...timeCells].map((td) => {
      const isAvailable = td.classList.contains("Available");
      const link = td.querySelector("a");
      const timeText = link?.textContent?.trim() || "";
      const bookingHref = link?.getAttribute("href") || "";
      return { isAvailable, timeText, bookingHref };
    });

    const firstAvailable = cells.find((c) => c.timeText);
    const slotLabel = firstAvailable?.timeText || currentHourLabel;

    slots.push({ label: slotLabel, cells });
  }

  return { courtNames, slots };
}

export async function fetchTvBookingData(
  clientId: string,
  venueId: string,
  date: Date
): Promise<TvGridData | null> {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const dateParam = `${y}${m}${d}`;

  const url = `${TV_API}/booking/${clientId}/fetch-booking-data?client_id=${clientId}&venue_id=${venueId}&resource_id=&date=${dateParam}&_=${Date.now()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const parsed = parseTvHtml(html);
  if (!parsed) throw new Error("Could not parse booking data");
  return parsed;
}

export async function fetchTvAvailability(
  venue: TvVenue,
  dateStr: string
): Promise<AvailabilityResult[]> {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const dateParam = `${y}${m}${dd}`;

  const r = await fetch(
    `${TV_API}/booking/${venue.clientId}/fetch-booking-data?client_id=${venue.clientId}&venue_id=${venue.venueId}&resource_id=&date=${dateParam}&_=${Date.now()}`
  );
  if (!r.ok) return [];
  const html = await r.text();
  const parsed = parseTvHtml(html);
  if (!parsed) return [];

  const results: AvailabilityResult[] = [];
  for (const slot of parsed.slots) {
    for (let ci = 0; ci < slot.cells.length; ci++) {
      const cell = slot.cells[ci]!;
      if (cell.isAvailable) {
        const timeMatch = slot.label.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        let timeMins: number | null = null;
        if (timeMatch) {
          let h = parseInt(timeMatch[1]!);
          const mins = parseInt(timeMatch[2]!);
          const isPm = timeMatch[3]!.toLowerCase() === "pm";
          if (isPm && h !== 12) h += 12;
          if (!isPm && h === 12) h = 0;
          timeMins = h * 60 + mins;
        }
        results.push({
          time: timeMins,
          timeLabel: slot.label,
          court: parsed.courtNames[ci] || `Court ${ci + 1}`,
          cost: "",
        });
      }
    }
  }
  return results;
}
