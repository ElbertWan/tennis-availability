import { Paper, Typography, Tabs, Tab, Stack, Button } from "@mui/material";
import { Search, Close } from "@mui/icons-material";
import type { Venue, TabConfig } from "@/types";
import { DateNavigator } from "@/components/molecules/DateNavigator";
import { VenuePicker } from "@/components/molecules/VenuePicker";
import { AvailabilityLegend } from "@/components/molecules/AvailabilityLegend";

interface AppHeaderProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  venues: Venue[];
  selectedVenueIds: string[];
  onSelectedVenuesChange: (ids: string[]) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}

export function AppHeader({
  tabs,
  activeTab,
  onTabChange,
  selectedDate,
  onDateChange,
  venues,
  selectedVenueIds,
  onSelectedVenuesChange,
  drawerOpen,
  onToggleDrawer,
}: AppHeaderProps) {
  return (
    <Paper
      component="header"
      square
      elevation={2}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        p: "16px 24px",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}
      >
        NSW Tennis Court Availability
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v: string) => onTabChange(v)}
        sx={{ mb: 1.5, "& .MuiTabs-indicator": { height: 3 } }}
      >
        {tabs.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </Tabs>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />

        <VenuePicker
          venues={venues}
          selected={selectedVenueIds}
          setSelected={onSelectedVenuesChange}
        />

        <Button
          variant={drawerOpen ? "outlined" : "contained"}
          startIcon={drawerOpen ? <Close /> : <Search />}
          onClick={onToggleDrawer}
          size="small"
          sx={{ whiteSpace: "nowrap" }}
        >
          {drawerOpen ? "Close Search" : "Find Available"}
        </Button>
      </Stack>

      <AvailabilityLegend showCoaching={activeTab === "main"} />
    </Paper>
  );
}
