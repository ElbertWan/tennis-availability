import { Stack } from "@mui/material";
import { LegendSwatch } from "@/components/atoms/LegendSwatch";

interface AvailabilityLegendProps {
  showCoaching: boolean;
}

export function AvailabilityLegend({ showCoaching }: AvailabilityLegendProps) {
  return (
    <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
      <LegendSwatch className="swatch-available" label="Available" />
      <LegendSwatch className="swatch-booked" label="Booked" />
      {showCoaching && (
        <LegendSwatch className="swatch-coaching" label="Coaching / Session" />
      )}
      <LegendSwatch className="swatch-closed" label="Closed / Booked" />
    </Stack>
  );
}
