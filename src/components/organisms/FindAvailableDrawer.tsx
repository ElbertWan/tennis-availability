import {
  Drawer,
  Stack,
  Typography,
  IconButton,
  Divider,
  Box,
  Button,
  Alert,
  LinearProgress,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import type { Dayjs } from "dayjs";
import type { Venue, SearchResult } from "@/types";
import { DRAWER_WIDTH } from "@/constants";
import { useAvailabilitySearch } from "@/hooks/useAvailabilitySearch";
import { SearchFilters } from "@/components/molecules/SearchFilters";
import { SearchResultGroup } from "@/components/molecules/SearchResultGroup";

interface FindAvailableDrawerProps {
  open: boolean;
  onClose: () => void;
  venues: Venue[];
  startTime: Dayjs;
  setStartTime: (v: Dayjs) => void;
  endTime: Dayjs;
  setEndTime: (v: Dayjs) => void;
  dateFrom: Dayjs;
  setDateFrom: (v: Dayjs) => void;
  dateTo: Dayjs;
  setDateTo: (v: Dayjs) => void;
  searchVenues: Venue[];
  setSearchVenues: (v: Venue[]) => void;
}

interface ResultGroup {
  dateStr: string;
  date: Date;
  items: SearchResult[];
}

function groupResults(results: SearchResult[]): ResultGroup[] {
  const grouped: ResultGroup[] = [];
  for (const r of results) {
    const last = grouped[grouped.length - 1];
    if (last && last.dateStr === r.dateStr) {
      last.items.push(r);
    } else {
      grouped.push({ dateStr: r.dateStr, date: r.date, items: [r] });
    }
  }
  return grouped;
}

export function FindAvailableDrawer({
  open,
  onClose,
  venues,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchVenues,
  setSearchVenues,
}: FindAvailableDrawerProps) {
  const {
    searching,
    results,
    progress,
    error,
    handleSearch,
    cancelSearch,
    clearError,
  } = useAvailabilitySearch(startTime, endTime, dateFrom, dateTo, searchVenues);

  const handleClose = () => {
    cancelSearch();
    onClose();
  };

  const progressPct =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={searching ? undefined : handleClose}
      variant="persistent"
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          bgcolor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Find Available Sessions
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />

      <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
        <Stack spacing={2}>
          <SearchFilters
            startTime={startTime}
            onStartTimeChange={setStartTime}
            endTime={endTime}
            onEndTimeChange={setEndTime}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            venues={venues}
            searchVenues={searchVenues}
            onSearchVenuesChange={setSearchVenues}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching}
            startIcon={<Search />}
            fullWidth
          >
            {searching ? "Searching..." : "Search"}
          </Button>

          {error && (
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          )}

          {searching && (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                Checking {progress.venue}... ({progress.current}/{progress.total})
              </Typography>
              <LinearProgress variant="determinate" value={progressPct} />
            </Box>
          )}

          {results !== null && !searching && (
            <>
              {results.length === 0 ? (
                <Alert severity="info">
                  No available sessions found in the selected range.
                </Alert>
              ) : (
                <Box>
                  {groupResults(results).map((group) => (
                    <SearchResultGroup
                      key={group.dateStr}
                      dateStr={group.dateStr}
                      date={group.date}
                      items={group.items}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}
