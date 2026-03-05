import { Box, Paper, Typography, Tabs, Tab, Stack, Button, IconButton } from "@mui/material";
import { Search, Close } from "@mui/icons-material";
import type { Venue, TabConfig } from "@/types";
import { DateNavigator } from "@/components/molecules/DateNavigator";
import { VenuePicker } from "@/components/molecules/VenuePicker";

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
    <>
      <Paper
        component="header"
        square
        elevation={2}
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, sm: 2 },
          pb: 0.5,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.15rem", sm: "1.5rem" },
          }}
        >
          NSW Tennis Court Availability
        </Typography>
      </Paper>

      <Paper
        square
        elevation={2}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1, sm: 1.5 },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v: string) => onTabChange(v)}
          sx={{
            mb: { xs: 1, sm: 1.5 },
            minHeight: { xs: 36, sm: 48 },
            "& .MuiTabs-indicator": { height: 3 },
            "& .MuiTab-root": {
              minHeight: { xs: 36, sm: 48 },
              py: { xs: 0.5, sm: 1 },
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            },
          }}
        >
          {tabs.map((t) => (
            <Tab key={t.id} value={t.id} label={t.label} />
          ))}
        </Tabs>

        {/* Desktop: single row */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ display: { xs: "none", sm: "flex" } }}
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

        {/* Mobile: compact two-row layout */}
        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
            <IconButton
              onClick={onToggleDrawer}
              size="small"
              color={drawerOpen ? "default" : "primary"}
              sx={{
                bgcolor: drawerOpen ? "action.selected" : "primary.main",
                color: drawerOpen ? "text.primary" : "primary.contrastText",
                "&:hover": {
                  bgcolor: drawerOpen ? "action.hover" : "primary.dark",
                },
                borderRadius: 1,
                px: 1,
              }}
            >
              {drawerOpen ? <Close fontSize="small" /> : <Search fontSize="small" />}
            </IconButton>
          </Stack>
          <Box sx={{ mt: 1 }}>
            <VenuePicker
              venues={venues}
              selected={selectedVenueIds}
              setSelected={onSelectedVenuesChange}
            />
          </Box>
        </Box>
      </Paper>
    </>
  );
}
