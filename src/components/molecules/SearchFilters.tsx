import { useMemo } from "react";
import {
  Stack,
  Autocomplete,
  TextField,
  Chip,
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";
import type { Venue } from "@/types";

interface SearchFiltersProps {
  startTime: Dayjs;
  onStartTimeChange: (v: Dayjs) => void;
  endTime: Dayjs;
  onEndTimeChange: (v: Dayjs) => void;
  dateFrom: Dayjs;
  onDateFromChange: (v: Dayjs) => void;
  dateTo: Dayjs;
  onDateToChange: (v: Dayjs) => void;
  venues: Venue[];
  searchVenues: Venue[];
  onSearchVenuesChange: (v: Venue[]) => void;
}

export function SearchFilters({
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  venues,
  searchVenues,
  onSearchVenuesChange,
}: SearchFiltersProps) {
  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => (a.suburb || "").localeCompare(b.suburb || "")),
    [venues]
  );

  return (
    <>
      <Stack direction="row" spacing={1.5}>
        <TimePicker
          label="Earliest time"
          value={startTime}
          onChange={(v) => {
            if (v) onStartTimeChange(v);
          }}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
        <TimePicker
          label="Latest time"
          value={endTime}
          onChange={(v) => {
            if (v) onEndTimeChange(v);
          }}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <DatePicker
          label="From date"
          value={dateFrom}
          onChange={(v) => {
            if (v) onDateFromChange(v);
          }}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
        <DatePicker
          label="To date"
          value={dateTo}
          onChange={(v) => {
            if (v) onDateToChange(v);
          }}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </Stack>

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={sortedVenues}
        value={searchVenues}
        groupBy={(option) => option.suburb || "Other"}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, newValue) => onSearchVenuesChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Venues"
            placeholder="Search venues..."
          />
        )}
        renderOption={(props, option, { selected: isSelected }) => {
          const { key, ...rest } = props;
          return (
            <ListItem key={key} {...rest} dense>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  checked={isSelected}
                  size="small"
                  sx={{ p: 0 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={option.name}
                primaryTypographyProps={{ fontSize: "0.84rem" }}
              />
            </ListItem>
          );
        }}
        renderTags={(value) => (
          <Chip
            size="small"
            label={`${value.length} venue${value.length !== 1 ? "s" : ""}`}
          />
        )}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      />
    </>
  );
}
