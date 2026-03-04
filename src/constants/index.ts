import type { TabConfig, SlotStatus } from "@/types";

export const TV_API = "/tv-api";
export const TENNIS_AU_API = "/v0/VenueBooking";
export const HILLS_API = "/hills-api/v2";

export const DRAWER_WIDTH = 420;

export const TABS: TabConfig[] = [
  { id: "main", label: "NSW Courts" },
  { id: "tv", label: "TennisVenues.com.au" },
];

export const STATUS_CLASS_MAP: Record<SlotStatus, string> = {
  available: "cell-available",
  booked: "cell-booked",
  coaching: "cell-coaching",
  session: "cell-session",
  closed: "cell-closed",
};
