import { useMemo } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import type { Venue } from "@/types";
import { groupBySuburb } from "@/utils/venue";

interface VenuePickerProps {
  venues: Venue[];
  selected: string[];
  setSelected: (ids: string[]) => void;
}

export function VenuePicker({ venues, selected, setSelected }: VenuePickerProps) {
  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => (a.suburb || "").localeCompare(b.suburb || "")),
    [venues]
  );

  const selectedVenues = useMemo(
    () => sortedVenues.filter((v) => selected.includes(v.id)),
    [sortedVenues, selected]
  );

  const suburbs = useMemo(() => groupBySuburb(venues), [venues]);
  const selectedSuburbs = suburbs.filter(([, vens]) =>
    vens.some((v) => selected.includes(v.id))
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={sortedVenues}
      value={selectedVenues}
      groupBy={(option) => option.suburb || "Other"}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_, newValue) => setSelected(newValue.map((v) => v.id))}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search venues..."
          sx={{ minWidth: { xs: 0, sm: 300 } }}
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
          label={`${selectedSuburbs.length} suburb${selectedSuburbs.length !== 1 ? "s" : ""} (${value.length} venue${value.length !== 1 ? "s" : ""})`}
          sx={{ maxWidth: 220 }}
        />
      )}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            maxHeight: 400,
          },
        },
        popper: { sx: { zIndex: 200 } },
      }}
      sx={{
        "& .MuiOutlinedInput-root": { fontSize: "0.85rem" },
      }}
    />
  );
}
