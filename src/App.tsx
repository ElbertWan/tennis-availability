import { useState } from "react";
import dayjs from "dayjs";
import type { Venue } from "@/types";
import { TABS } from "@/constants";
import { ALL_VENUES, TV_VENUES } from "@/venues";
import { MainLayout } from "@/components/templates/MainLayout";
import { AppHeader } from "@/components/organisms/AppHeader";
import { VenueGrid } from "@/components/organisms/VenueGrid";
import { TvVenueGrid } from "@/components/organisms/TvVenueGrid";
import { FindAvailableDrawer } from "@/components/organisms/FindAvailableDrawer";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("main");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selected, setSelected] = useState(ALL_VENUES.map((v) => v.id));
  const [tvSelected, setTvSelected] = useState(TV_VENUES.map((v) => v.id));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchStartTime, setSearchStartTime] = useState(dayjs().hour(8).minute(0));
  const [searchEndTime, setSearchEndTime] = useState(dayjs().hour(20).minute(0));
  const [searchDateFrom, setSearchDateFrom] = useState(dayjs());
  const [searchDateTo, setSearchDateTo] = useState(dayjs().add(7, "day"));
  const [searchVenues, setSearchVenues] = useState<Venue[]>(() =>
    ALL_VENUES.slice(0, 5)
  );

  const currentVenues = activeTab === "main" ? ALL_VENUES : TV_VENUES;
  const currentSelected = activeTab === "main" ? selected : tvSelected;
  const currentSetSelected = activeTab === "main" ? setSelected : setTvSelected;

  return (
    <MainLayout
      drawerOpen={drawerOpen}
      header={
        <AppHeader
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          venues={currentVenues}
          selectedVenueIds={currentSelected}
          onSelectedVenuesChange={currentSetSelected}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((p) => !p)}
        />
      }
      drawer={
        <FindAvailableDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          venues={currentVenues}
          startTime={searchStartTime}
          setStartTime={setSearchStartTime}
          endTime={searchEndTime}
          setEndTime={setSearchEndTime}
          dateFrom={searchDateFrom}
          setDateFrom={setSearchDateFrom}
          dateTo={searchDateTo}
          setDateTo={setSearchDateTo}
          searchVenues={searchVenues}
          setSearchVenues={setSearchVenues}
        />
      }
    >
      {activeTab === "main" &&
        ALL_VENUES.filter((v) => selected.includes(v.id)).map((v) => (
          <VenueGrid key={v.id} venue={v} date={selectedDate} />
        ))}
      {activeTab === "tv" &&
        TV_VENUES.filter((v) => tvSelected.includes(v.id)).map((v) => (
          <TvVenueGrid key={v.id} venue={v} date={selectedDate} />
        ))}
    </MainLayout>
  );
}
