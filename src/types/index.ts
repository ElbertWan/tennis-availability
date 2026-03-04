// ─── Venue types (discriminated union) ───

interface BaseVenue {
  id: string;
  name: string;
  suburb: string;
}

export interface TennisAuVenue extends BaseVenue {
  source: "tennisAu";
  slug: string;
}

export interface HillsVenue extends BaseVenue {
  source: "hills";
  venueId: number;
  bookingSlug: string;
}

export interface TvVenue extends BaseVenue {
  source: "tv";
  clientId: string;
  venueId: string;
}

export type Venue = TennisAuVenue | HillsVenue | TvVenue;

// ─── Slot / session status ───

export type SlotStatus = "available" | "booked" | "coaching" | "session" | "closed";

export interface SlotInfo {
  status: SlotStatus;
  label: string;
  colour: string | null;
}

// ─── Parsed session (from Tennis AU API) ───

export interface ParsedSession {
  name: string;
  category: number;
  startTime: number;
  endTime: number;
  capacity: number;
  cost: number;
  colour: string | null;
}

// ─── Tennis AU API responses ───

export interface TennisAuRawSession {
  Name: string;
  Category: number;
  StartTime: number;
  EndTime: number;
  Capacity: number;
  CostFrom?: number;
  Cost?: number;
  Colour?: string;
}

export interface TennisAuDay {
  Sessions: TennisAuRawSession[];
}

export interface TennisAuResource {
  ID: number;
  Name: string;
  Days?: TennisAuDay[];
}

export interface TennisAuResponse {
  Resources: TennisAuResource[];
  EarliestStartTime: number;
  LatestEndTime: number;
  MinimumInterval?: number;
}

// ─── Hills API responses ───

export interface HillsCourt {
  ItemID: number;
  Name: string;
  HourlyRate?: number;
}

export interface HillsBooking {
  ItemID: number;
  Start_Date: string;
  End_Date: string;
}

export interface HillsOpeningHours {
  DayOfWeek?: number;
  dayOfWeek?: number;
  OpenTime?: string;
  openTime?: string;
  CloseTime?: string;
  closeTime?: string;
}

// ─── TennisVenues.com.au parsed data ───

export interface TvSlotCell {
  isAvailable: boolean;
  timeText: string;
  bookingHref: string;
}

export interface TvSlot {
  label: string;
  cells: TvSlotCell[];
}

export interface TvGridData {
  courtNames: string[];
  slots: TvSlot[];
}

// ─── Availability search results ───

export interface AvailabilityResult {
  time: number | null;
  timeLabel?: string;
  court: string;
  cost: string;
}

export interface SearchResult {
  venue: Venue;
  date: Date;
  dateStr: string;
  time: number | null;
  timeLabel: string;
  court: string;
  cost: string;
  totalAvailable: number;
}

export interface SearchProgress {
  current: number;
  total: number;
  venue: string;
}

// ─── Tab config ───

export interface TabConfig {
  id: string;
  label: string;
}

// ─── Hills internal booking range ───

export interface HillsBookingRange {
  start: number;
  end: number;
}
