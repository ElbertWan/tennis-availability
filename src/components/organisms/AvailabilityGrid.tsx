import type { SlotInfo } from "@/types";
import { minutesToTime } from "@/utils/time";
import { tableStyle } from "@/utils/venue";
import { StatusCell } from "@/components/atoms/StatusCell";
import { BookButton } from "@/components/atoms/BookButton";

interface Column {
  id: string | number;
  name: string;
}

interface AvailabilityGridProps {
  venueName: string;
  bookingUrl: string;
  columns: Column[];
  timeSlots: number[];
  getSlotInfo: (columnId: string | number, slotStart: number) => SlotInfo;
}

export function AvailabilityGrid({
  venueName,
  bookingUrl,
  columns,
  timeSlots,
  getSlotInfo,
}: AvailabilityGridProps) {
  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venueName}
        <BookButton href={bookingUrl} />
      </h2>
      <div className="table-wrapper">
        <table className="availability-table" style={tableStyle(columns.length)}>
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {columns.map((c) => (
                <th key={c.id} className="court-header">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="time-cell">{minutesToTime(slot)}</td>
                {columns.map((c) => (
                  <StatusCell key={c.id} info={getSlotInfo(c.id, slot)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
