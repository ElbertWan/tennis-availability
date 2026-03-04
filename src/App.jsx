import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import {
  Tabs, Tab, Button, IconButton, Checkbox, Chip,
  Autocomplete, TextField, Box, Typography, Stack, Paper,
  ListItem, ListItemIcon, ListItemText,
  Drawer, Divider,
  LinearProgress, Alert, Table, TableBody, TableRow, TableCell,
} from "@mui/material";
import {
  ChevronLeft, ChevronRight, OpenInNew, Search, Close,
} from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { ALL_VENUES, TV_VENUES } from "./venues";
import "./App.css";

const TV_API = "/tv-api";

const TENNIS_AU_API = "/v0/VenueBooking";
const HILLS_API = "/hills-api/v2";

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function tableStyle(numCourts) {
  if (numCourts <= 4) return undefined;
  return { width: `calc(90px + ${numCourts} * ((100% - 90px) / 4))` };
}

function shiftDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseSession(session) {
  return {
    name: session.Name,
    category: session.Category,
    startTime: session.StartTime,
    endTime: session.EndTime,
    capacity: session.Capacity,
    cost: session.CostFrom ?? session.Cost ?? 0,
    colour: session.Colour || null,
  };
}

function getStatusForSlot(sessions, slotStart) {
  for (const s of sessions) {
    if (slotStart >= s.startTime && slotStart < s.endTime) {
      if (s.category === 1000) return { status: "booked", label: s.name, colour: s.colour || "#fcfabd" };
      if (s.category === 0 && s.capacity > 0) return { status: "available", label: `$${s.cost.toFixed(2)}`, colour: null };
      if (s.category === 2) return { status: "coaching", label: s.name, colour: s.colour || "#c3e6cb" };
      return { status: "session", label: s.name, colour: s.colour || "#d4edda" };
    }
  }
  return { status: "closed", label: "", colour: null };
}

function StatusCell({ info }) {
  const classMap = {
    available: "cell-available",
    booked: "cell-booked",
    coaching: "cell-coaching",
    session: "cell-session",
    closed: "cell-closed",
  };
  return (
    <td
      className={`grid-cell ${classMap[info.status]}`}
      style={info.colour ? { backgroundColor: info.colour } : undefined}
      title={info.label}
    >
      <span className="cell-text">{info.label}</span>
    </td>
  );
}

// ─── Tennis Australia grid ───

const TennisAuGrid = memo(function TennisAuGrid({ venue, date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const dateStr = formatDate(date);
    fetch(`${TENNIS_AU_API}/${venue.slug}/GetVenueSessions?resourceID=&startDate=${dateStr}&endDate=${dateStr}&roleId=&_=${Date.now()}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [venue.slug, date]);

  if (loading) return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error) return <div className="venue-error">{venue.name}: {error}</div>;
  if (!data?.Resources?.length) return <div className="venue-error">{venue.name}: No data available</div>;

  const timeSlots = [];
  for (let t = data.EarliestStartTime; t < data.LatestEndTime; t += (data.MinimumInterval || 30)) timeSlots.push(t);

  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venue.name}
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
          href={`https://play.tennis.com.au/${venue.slug}/Booking/BookByDate#?date=${formatDate(date)}&role=guest`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontSize: '0.75rem', ml: 1, py: 0.25, whiteSpace: 'nowrap' }}
        >
          Book
        </Button>
      </h2>
      <div className="table-wrapper">
        <table className="availability-table" style={tableStyle(data.Resources.length)}>
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {data.Resources.map((r) => <th key={r.ID} className="court-header">{r.Name}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="time-cell">{minutesToTime(slot)}</td>
                {data.Resources.map((r) => {
                  const info = getStatusForSlot((r.Days?.[0]?.Sessions || []).map(parseSession), slot);
                  return <StatusCell key={r.ID} info={info} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Hills Shire grid ───

function timeToMinutes(isoStr) {
  const d = new Date(isoStr);
  return d.getHours() * 60 + d.getMinutes();
}

const HillsVenueGrid = memo(function HillsVenueGrid({ venue, date }) {
  const [courts, setCourts] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const dateStr = formatDate(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = formatDate(nextDate);

    Promise.all([
      fetch(`${HILLS_API}/venues/${venue.venueId}/bookables`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(`${HILLS_API}/venues/${venue.venueId}/bookingbookablesinperiod?fromDate=${dateStr}&toDate=${nextDateStr}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(`${HILLS_API}/venues/${venue.venueId}/getbaseopeninghourslist`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([courtsData, bookingsData, hoursData]) => {
        if (cancelled) return;
        setCourts(courtsData.filter((b) => b.Name?.includes("Tennis") || b.Name?.includes("Court")));
        setBookings(bookingsData);
        setHours(hoursData);
      })
      .catch((err) => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [venue.venueId, date]);

  if (loading) return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error) return <div className="venue-error">{venue.name}: {error}</div>;
  if (!courts?.length) return <div className="venue-error">{venue.name}: No courts found</div>;

  const dateStr = formatDate(date);
  const dayBookings = (bookings || []).filter((b) => b.Start_Date?.startsWith(dateStr));

  let openMinutes = 7 * 60;
  let closeMinutes = 22 * 60;
  if (hours?.length) {
    const dayHours = hours.find((h) => (h.DayOfWeek ?? h.dayOfWeek) === date.getDay());
    if (dayHours) {
      const open = dayHours.OpenTime || dayHours.openTime;
      const close = dayHours.CloseTime || dayHours.closeTime;
      if (open) { const p = open.split(":"); openMinutes = parseInt(p[0]) * 60 + parseInt(p[1] || 0); }
      if (close) { const p = close.split(":"); closeMinutes = parseInt(p[0]) * 60 + parseInt(p[1] || 0); }
    }
  }

  const interval = 30;
  const timeSlots = [];
  for (let t = openMinutes; t < closeMinutes; t += interval) timeSlots.push(t);

  const bookingsByCourtId = {};
  for (const b of dayBookings) {
    if (!bookingsByCourtId[b.ItemID]) bookingsByCourtId[b.ItemID] = [];
    bookingsByCourtId[b.ItemID].push({ start: timeToMinutes(b.Start_Date), end: timeToMinutes(b.End_Date) });
  }

  function getHillsStatus(court, slotStart) {
    for (const b of (bookingsByCourtId[court.ItemID] || [])) {
      if (slotStart >= b.start && slotStart < b.end) return { status: "booked", label: "Booked", colour: null };
    }
    const rate = court.HourlyRate || 21;
    return { status: "available", label: `$${((rate * interval) / 60).toFixed(2)}`, colour: null };
  }

  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venue.name}
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
          href={`https://hills.bookable.net.au/venues/${venue.venueId}/${venue.bookingSlug}?categoryId=4`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontSize: '0.75rem', ml: 1, py: 0.25, whiteSpace: 'nowrap' }}
        >
          Book
        </Button>
      </h2>
      <div className="table-wrapper">
        <table className="availability-table" style={tableStyle(courts.length)}>
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {courts.map((c) => <th key={c.ItemID} className="court-header">{c.Name}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="time-cell">{minutesToTime(slot)}</td>
                {courts.map((c) => <StatusCell key={c.ItemID} info={getHillsStatus(c, slot)} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Unified grid dispatcher ───

function VenueGrid({ venue, date }) {
  if (venue.source === "hills") return <HillsVenueGrid venue={venue} date={date} />;
  return <TennisAuGrid venue={venue} date={date} />;
}

// ─── Suburb picker (MUI Autocomplete with grouped checkboxes) ───

function groupBySuburb(venues) {
  const map = new Map();
  for (const v of venues) {
    const suburb = v.suburb || "Other";
    if (!map.has(suburb)) map.set(suburb, []);
    map.get(suburb).push(v);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function VenuePicker({ venues, selected, setSelected }) {
  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => (a.suburb || "").localeCompare(b.suburb || "")),
    [venues]
  );

  const selectedVenues = useMemo(
    () => sortedVenues.filter((v) => selected.includes(v.id)),
    [sortedVenues, selected]
  );

  const suburbs = useMemo(() => groupBySuburb(venues), [venues]);
  const selectedSuburbs = suburbs.filter(([, vens]) => vens.some((v) => selected.includes(v.id)));

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
          sx={{ minWidth: 300 }}
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
              primaryTypographyProps={{ fontSize: '0.84rem' }}
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
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            maxHeight: 400,
          },
        },
        popper: { sx: { zIndex: 200 } },
      }}
      sx={{
        '& .MuiOutlinedInput-root': { fontSize: '0.85rem' },
      }}
    />
  );
}

// ─── TennisVenues.com.au grid (HTML parsing) ───

function parseTvHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table.BookingSheet");
  if (!table) return null;

  const headerCells = table.querySelectorAll("thead td.BookingSheetCategoryLabel");
  const courtNames = [...headerCells].map((td) => td.textContent.trim());

  const rows = table.querySelectorAll("tbody tr");
  const slots = [];
  let currentHourLabel = "";

  for (const row of rows) {
    const labelCell = row.querySelector("td.BookingSheetTimeLabel");
    const timeCells = row.querySelectorAll("td.TimeCell");
    if (!timeCells.length) continue;

    const labelText = labelCell?.textContent?.trim() || "";
    if (labelText && labelText !== "\u00a0") currentHourLabel = labelText;

    const cells = [...timeCells].map((td) => {
      const isAvailable = td.classList.contains("Available");
      const link = td.querySelector("a");
      const timeText = link?.textContent?.trim() || "";
      const bookingHref = link?.getAttribute("href") || "";
      return { isAvailable, timeText, bookingHref };
    });

    const firstAvailable = cells.find((c) => c.timeText);
    const slotLabel = firstAvailable?.timeText || currentHourLabel;

    slots.push({ label: slotLabel, cells });
  }

  return { courtNames, slots };
}

const TvVenueGrid = memo(function TvVenueGrid({ venue, date }) {
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    const dateParam = `${y}${m}${d}`;

    const url = `${TV_API}/booking/${venue.clientId}/fetch-booking-data?client_id=${venue.clientId}&venue_id=${venue.venueId}&resource_id=&date=${dateParam}&_=${Date.now()}`;

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then((html) => {
        if (cancelled) return;
        const parsed = parseTvHtml(html);
        if (!parsed) throw new Error("Could not parse booking data");
        setGridData(parsed);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [venue.clientId, venue.venueId, date]);

  if (loading) return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error) return <div className="venue-error">{venue.name}: {error}</div>;
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
          sx={{ fontSize: '0.75rem', ml: 1, py: 0.25, whiteSpace: 'nowrap' }}
        >
          Book
        </Button>
      </h2>
      <div className="table-wrapper">
        <table className="availability-table" style={tableStyle(courtNames.length)}>
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {courtNames.map((name, i) => <th key={i} className="court-header">{name}</th>)}
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
                      {cell.isAvailable && cell.bookingHref
                        ? <a href={`https://www.tennisvenues.com.au${cell.bookingHref}`} target="_blank" rel="noopener noreferrer" className="tv-slot-link">{cell.timeText || "Open"}</a>
                        : cell.isAvailable ? (cell.timeText || "Open") : ""}
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

// ─── Find next available session search logic ───

async function fetchTennisAuAvailability(venue, dateStr) {
  const r = await fetch(
    `${TENNIS_AU_API}/${venue.slug}/GetVenueSessions?resourceID=&startDate=${dateStr}&endDate=${dateStr}&roleId=&_=${Date.now()}`
  );
  if (!r.ok) return [];
  const json = await r.json();
  if (!json?.Resources?.length) return [];

  const interval = json.MinimumInterval || 30;
  const results = [];
  for (const resource of json.Resources) {
    const sessions = (resource.Days?.[0]?.Sessions || []).map(parseSession);
    for (let t = json.EarliestStartTime; t < json.LatestEndTime; t += interval) {
      const info = getStatusForSlot(sessions, t);
      if (info.status === "available") {
        results.push({ time: t, court: resource.Name, cost: info.label });
      }
    }
  }
  return results;
}

async function fetchHillsAvailability(venue, dateStr) {
  const nextDate = shiftDate(new Date(dateStr + "T00:00:00"), 1);
  const nextDateStr = formatDate(nextDate);

  const [courtsData, bookingsData, hoursData] = await Promise.all([
    fetch(`${HILLS_API}/venues/${venue.venueId}/bookables`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : []),
    fetch(`${HILLS_API}/venues/${venue.venueId}/bookingbookablesinperiod?fromDate=${dateStr}&toDate=${nextDateStr}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : []),
    fetch(`${HILLS_API}/venues/${venue.venueId}/getbaseopeninghourslist`, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : []).catch(() => []),
  ]);

  const courts = courtsData.filter((b) => b.Name?.includes("Tennis") || b.Name?.includes("Court"));
  if (!courts.length) return [];

  const date = new Date(dateStr + "T00:00:00");
  let openMinutes = 7 * 60;
  let closeMinutes = 22 * 60;
  if (hoursData?.length) {
    const dayHours = hoursData.find((h) => (h.DayOfWeek ?? h.dayOfWeek) === date.getDay());
    if (dayHours) {
      const open = dayHours.OpenTime || dayHours.openTime;
      const close = dayHours.CloseTime || dayHours.closeTime;
      if (open) { const p = open.split(":"); openMinutes = parseInt(p[0]) * 60 + parseInt(p[1] || 0); }
      if (close) { const p = close.split(":"); closeMinutes = parseInt(p[0]) * 60 + parseInt(p[1] || 0); }
    }
  }

  const dayBookings = (bookingsData || []).filter((b) => b.Start_Date?.startsWith(dateStr));
  const bookingsByCourtId = {};
  for (const b of dayBookings) {
    if (!bookingsByCourtId[b.ItemID]) bookingsByCourtId[b.ItemID] = [];
    bookingsByCourtId[b.ItemID].push({ start: timeToMinutes(b.Start_Date), end: timeToMinutes(b.End_Date) });
  }

  const interval = 30;
  const results = [];
  for (const court of courts) {
    for (let t = openMinutes; t < closeMinutes; t += interval) {
      const isBooked = (bookingsByCourtId[court.ItemID] || []).some((b) => t >= b.start && t < b.end);
      if (!isBooked) {
        const rate = court.HourlyRate || 21;
        results.push({ time: t, court: court.Name, cost: `$${((rate * interval) / 60).toFixed(2)}` });
      }
    }
  }
  return results;
}

async function fetchTvAvailability(venue, dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const dateParam = `${y}${m}${dd}`;

  const r = await fetch(`${TV_API}/booking/${venue.clientId}/fetch-booking-data?client_id=${venue.clientId}&venue_id=${venue.venueId}&resource_id=&date=${dateParam}&_=${Date.now()}`);
  if (!r.ok) return [];
  const html = await r.text();
  const parsed = parseTvHtml(html);
  if (!parsed) return [];

  const results = [];
  for (const slot of parsed.slots) {
    for (let ci = 0; ci < slot.cells.length; ci++) {
      const cell = slot.cells[ci];
      if (cell.isAvailable) {
        const timeMatch = slot.label.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        let timeMins = null;
        if (timeMatch) {
          let h = parseInt(timeMatch[1]);
          const mins = parseInt(timeMatch[2]);
          const isPm = timeMatch[3].toLowerCase() === "pm";
          if (isPm && h !== 12) h += 12;
          if (!isPm && h === 12) h = 0;
          timeMins = h * 60 + mins;
        }
        results.push({
          time: timeMins,
          timeLabel: slot.label,
          court: parsed.courtNames[ci] || `Court ${ci + 1}`,
          cost: "",
        });
      }
    }
  }
  return results;
}

const DRAWER_WIDTH = 420;

function FindAvailableDrawer({
  open, onClose, venues,
  startTime, setStartTime, endTime, setEndTime,
  dateFrom, setDateFrom, dateTo, setDateTo,
  searchVenues, setSearchVenues,
}) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, venue: "" });
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => (a.suburb || "").localeCompare(b.suburb || "")),
    [venues]
  );

  const handleSearch = useCallback(async () => {
    cancelledRef.current = false;
    setSearching(true);
    setResults(null);
    setError(null);

    const startMins = startTime.hour() * 60 + startTime.minute();
    const endMins = endTime.hour() * 60 + endTime.minute();

    if (endMins <= startMins) {
      setError("End time must be after start time.");
      setSearching(false);
      return;
    }
    if (!searchVenues.length) {
      setError("Please select at least one venue.");
      setSearching(false);
      return;
    }
    if (dateTo.isBefore(dateFrom)) {
      setError("End date must be on or after start date.");
      setSearching(false);
      return;
    }

    const days = [];
    let cursor = dateFrom.startOf("day");
    const end = dateTo.startOf("day");
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      days.push(cursor);
      cursor = cursor.add(1, "day");
    }

    const totalSteps = days.length * searchVenues.length;
    setProgress({ current: 0, total: totalSteps, venue: "" });

    const found = [];
    let step = 0;

    for (const day of days) {
      const dateStr = day.format("YYYY-MM-DD");
      const dateNative = day.toDate();

      for (const venue of searchVenues) {
        if (cancelledRef.current) { setSearching(false); return; }
        step++;
        setProgress({ current: step, total: totalSteps, venue: venue.name });

        try {
          let slots = [];
          if (venue.source === "tennisAu") {
            slots = await fetchTennisAuAvailability(venue, dateStr);
          } else if (venue.source === "hills") {
            slots = await fetchHillsAvailability(venue, dateStr);
          } else if (venue.source === "tv") {
            slots = await fetchTvAvailability(venue, dateStr);
          }

          const requiredSlots = [];
          for (let t = startMins; t < endMins; t += 30) requiredSlots.push(t);

          const slotsByCourt = new Map();
          for (const s of slots) {
            if (s.time === null || s.time === undefined) continue;
            if (s.time < startMins || s.time >= endMins) continue;
            if (!slotsByCourt.has(s.court)) slotsByCourt.set(s.court, new Map());
            slotsByCourt.get(s.court).set(s.time, s);
          }

          for (const [court, courtSlotMap] of slotsByCourt) {
            const hasAll = requiredSlots.every((t) => courtSlotMap.has(t));
            if (hasAll) {
              const firstSlot = courtSlotMap.get(requiredSlots[0]);
              found.push({
                venue,
                date: dateNative,
                dateStr,
                time: firstSlot.time,
                timeLabel: firstSlot.timeLabel || minutesToTime(firstSlot.time),
                court,
                cost: firstSlot.cost,
                totalAvailable: requiredSlots.length,
              });
            }
          }
        } catch {
          // skip venues that fail
        }
      }
    }

    if (!cancelledRef.current) {
      setResults(found);
      setSearching(false);
    }
  }, [startTime, endTime, dateFrom, dateTo, searchVenues]);

  const handleClose = () => {
    cancelledRef.current = true;
    setSearching(false);
    onClose();
  };

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={searching ? undefined : handleClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Find Available Sessions
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />

      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5}>
            <TimePicker
              label="Earliest time"
              value={startTime}
              onChange={(v) => { if (v) setStartTime(v); }}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <TimePicker
              label="Latest time"
              value={endTime}
              onChange={(v) => { if (v) setEndTime(v); }}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <DatePicker
              label="From date"
              value={dateFrom}
              onChange={(v) => { if (v) setDateFrom(v); }}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <DatePicker
              label="To date"
              value={dateTo}
              onChange={(v) => { if (v) setDateTo(v); }}
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
            onChange={(_, newValue) => setSearchVenues(newValue)}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Venues" placeholder="Search venues..." />
            )}
            renderOption={(props, option, { selected: isSelected }) => {
              const { key, ...rest } = props;
              return (
                <ListItem key={key} {...rest} dense>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox edge="start" checked={isSelected} size="small" sx={{ p: 0 }} />
                  </ListItemIcon>
                  <ListItemText primary={option.name} primaryTypographyProps={{ fontSize: '0.84rem' }} />
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
              paper: { sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } },
            }}
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

          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

          {searching && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Checking {progress.venue}... ({progress.current}/{progress.total})
              </Typography>
              <LinearProgress variant="determinate" value={progressPct} />
            </Box>
          )}

          {results !== null && !searching && (
            results.length === 0 ? (
              <Alert severity="info">No available sessions found in the selected range.</Alert>
            ) : (
              <Box>
                {(() => {
                  const grouped = [];
                  for (const r of results) {
                    const last = grouped[grouped.length - 1];
                    if (last && last.dateStr === r.dateStr) {
                      last.items.push(r);
                    } else {
                      grouped.push({ dateStr: r.dateStr, date: r.date, items: [r] });
                    }
                  }
                  return grouped.map((group) => (
                    <Box key={group.dateStr} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, position: 'sticky', top: 0, bgcolor: 'background.paper', py: 0.5, zIndex: 1 }}>
                        {dayjs(group.date).format("ddd, D MMM YYYY")}
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          {group.items.map((r, i) => {
                            let bookUrl = "#";
                            if (r.venue.source === "tennisAu") bookUrl = `https://play.tennis.com.au/${r.venue.slug}/Booking/BookByDate#?date=${r.dateStr}&role=guest`;
                            else if (r.venue.source === "hills") bookUrl = `https://hills.bookable.net.au/venues/${r.venue.venueId}/${r.venue.bookingSlug}?categoryId=4`;
                            else if (r.venue.source === "tv") bookUrl = `https://www.tennisvenues.com.au/booking/${r.venue.clientId}?date=${r.dateStr.replace(/-/g, "")}`;
                            return (
                              <TableRow key={i}>
                                <TableCell sx={{ py: 0.75, pl: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>{r.venue.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {r.court}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 0.75 }}>
                                  <Typography variant="body2">{r.timeLabel}</Typography>
                                  {r.cost && <Typography variant="caption" color="text.secondary">{r.cost}</Typography>}
                                </TableCell>
                                <TableCell sx={{ py: 0.75, pr: 0 }}>
                                  <IconButton
                                    size="small"
                                    href={bookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <OpenInNew fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  ));
                })()}
              </Box>
            )
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

// ─── App ───

const TABS = [
  { id: "main", label: "NSW Courts" },
  { id: "tv", label: "TennisVenues.com.au" },
];

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
  const [searchVenues, setSearchVenues] = useState(() => ALL_VENUES.slice(0, 5));

  const currentVenues = activeTab === "main" ? ALL_VENUES : TV_VENUES;
  const currentSelected = activeTab === "main" ? selected : tvSelected;
  const currentSetSelected = activeTab === "main" ? setSelected : setTvSelected;

  return (
    <Box
      className="app"
      sx={{
        mr: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
        transition: 'margin-right 225ms cubic-bezier(0, 0, 0.2, 1)',
      }}
    >
      <Paper
        component="header"
        square
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          p: '16px 24px',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5 }}>
          NSW Tennis Court Availability
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 1.5, '& .MuiTabs-indicator': { height: 3 } }}
        >
          {TABS.map((t) => (
            <Tab key={t.id} value={t.id} label={t.label} />
          ))}
        </Tabs>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              title="Previous day"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(v) => { if (v) setSelectedDate(v.toDate()); }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 160, '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              title="Next day"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Stack>

          <VenuePicker
            venues={currentVenues}
            selected={currentSelected}
            setSelected={currentSetSelected}
          />

          <Button
            variant={drawerOpen ? "outlined" : "contained"}
            startIcon={drawerOpen ? <Close /> : <Search />}
            onClick={() => setDrawerOpen((p) => !p)}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {drawerOpen ? "Close Search" : "Find Available"}
          </Button>
        </Stack>

        <Stack direction="row" spacing={2.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box className="swatch swatch-available" />
            <Typography variant="caption" color="text.secondary">Available</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box className="swatch swatch-booked" />
            <Typography variant="caption" color="text.secondary">Booked</Typography>
          </Stack>
          {activeTab === "main" && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box className="swatch swatch-coaching" />
              <Typography variant="caption" color="text.secondary">Coaching / Session</Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box className="swatch swatch-closed" />
            <Typography variant="caption" color="text.secondary">Closed / Booked</Typography>
          </Stack>
        </Stack>
      </Paper>

      <main className="venue-list">
        {activeTab === "main" &&
          ALL_VENUES.filter((v) => selected.includes(v.id)).map((v) => (
            <VenueGrid key={v.id} venue={v} date={selectedDate} />
          ))}
        {activeTab === "tv" &&
          TV_VENUES.filter((v) => tvSelected.includes(v.id)).map((v) => (
            <TvVenueGrid key={v.id} venue={v} date={selectedDate} />
          ))}
      </main>

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
    </Box>
  );
}
