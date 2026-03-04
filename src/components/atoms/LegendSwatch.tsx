import { Stack, Box, Typography } from "@mui/material";

interface LegendSwatchProps {
  className: string;
  label: string;
}

export function LegendSwatch({ className, label }: LegendSwatchProps) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box className={`swatch ${className}`} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
