import { memo } from "react";
import { Button } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import type { TvVenue } from "@/types";
import { useTvData } from "@/hooks/useTvData";
import { tableStyle } from "@/utils/venue";

interface TvVenueGridProps {
  venue: TvVenue;
  date: Date;
}

export const TvVenueGrid = memo(function TvVenueGrid({
  venue,
  date,
}: TvVenueGridProps) {
  const { gridData, loading, error } = useTvData(
    venue.clientId,
    venue.venueId,
    date
  );

  if (loading)
    return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error)
    return (
      <div className="venue-error">
        {venue.name}: {error}
      </div>
    );
  if (!gridData) return <div className="venue-error">{venue.name}: No data</div>;

  const { courtNames, slots } = gridData;

  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venue.name}
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
          href={`https://www.tennisvenues.com.au/booking/${venue.clientId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontSize: "0.75rem", ml: 1, py: 0.25, whiteSpace: "nowrap" }}
        >
          Book
        </Button>
      </h2>
      <div className="table-wrapper">
        <table
          className="availability-table"
          style={tableStyle(courtNames.length)}
        >
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {courtNames.map((name, i) => (
                <th key={i} className="court-header">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, si) => (
              <tr key={si}>
                <td className="time-cell">{slot.label}</td>
                {slot.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`grid-cell ${cell.isAvailable ? "cell-available" : "cell-closed"}`}
                  >
                    <span className="cell-text">
                      {cell.isAvailable && cell.bookingHref ? (
                        <a
                          href={`https://www.tennisvenues.com.au${cell.bookingHref}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tv-slot-link"
                        >
                          {cell.timeText || "Open"}
                        </a>
                      ) : cell.isAvailable ? (
                        cell.timeText || "Open"
                      ) : (
                        ""
                      )}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
