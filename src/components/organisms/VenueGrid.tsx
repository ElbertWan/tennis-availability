import type { Venue } from "@/types";
import { TennisAuGrid } from "./TennisAuGrid";
import { HillsVenueGrid } from "./HillsVenueGrid";
import { TvVenueGrid } from "./TvVenueGrid";

interface VenueGridProps {
  venue: Venue;
  date: Date;
}

export function VenueGrid({ venue, date }: VenueGridProps) {
  switch (venue.source) {
    case "hills":
      return <HillsVenueGrid venue={venue} date={date} />;
    case "tv":
      return <TvVenueGrid venue={venue} date={date} />;
    case "tennisAu":
      return <TennisAuGrid venue={venue} date={date} />;
  }
}
