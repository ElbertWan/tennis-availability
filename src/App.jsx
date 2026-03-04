import { useState, useEffect, useMemo } from "react";
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
  // Each court gets 1/4 of the non-time-column space, so the table grows wider than 100%
  // Time col = 90px, each court col = (100% - 90px) / 4
  // Total = 90px + numCourts * ((100% - 90px) / 4)
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

function TennisAuGrid({ venue, date }) {
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
        <a href={`https://play.tennis.com.au/${venue.slug}/Booking/BookByDate`} target="_blank" rel="noopener noreferrer" className="booking-link">Book &rarr;</a>
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
}

// ─── Hills Shire grid ───

function timeToMinutes(isoStr) {
  const d = new Date(isoStr);
  return d.getHours() * 60 + d.getMinutes();
}

function HillsVenueGrid({ venue, date }) {
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
        <a href={`https://hills.bookable.net.au/venues/${venue.venueId}`} target="_blank" rel="noopener noreferrer" className="booking-link">Book &rarr;</a>
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
}

// ─── Unified grid dispatcher ───

function VenueGrid({ venue, date }) {
  if (venue.source === "hills") return <HillsVenueGrid venue={venue} date={date} />;
  return <TennisAuGrid venue={venue} date={date} />;
}

// ─── Suburb picker ───

function groupBySuburb(venues) {
  const map = new Map();
  for (const v of venues) {
    const suburb = v.suburb || "Other";
    if (!map.has(suburb)) map.set(suburb, []);
    map.get(suburb).push(v);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function SuburbPicker({ venues, selected, setSelected, showPicker, setShowPicker }) {
  const [expanded, setExpanded] = useState({});
  const suburbs = useMemo(() => groupBySuburb(venues), [venues]);

  const keyFn = (v) => v.id;

  const toggleSuburb = (suburb) =>
    setExpanded((prev) => ({ ...prev, [suburb]: !prev[suburb] }));

  const toggleVenue = (key) =>
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const toggleAllInSuburb = (suburb, suburbVenues) => {
    const keys = suburbVenues.map(keyFn);
    const allSelected = keys.every((k) => selected.includes(k));
    if (allSelected) setSelected((prev) => prev.filter((k) => !keys.includes(k)));
    else setSelected((prev) => [...new Set([...prev, ...keys])]);
  };

  const selectAll = () => setSelected(venues.map(keyFn));
  const selectNone = () => setSelected([]);

  const selectedSuburbs = suburbs.filter(([, vens]) => vens.some((v) => selected.includes(keyFn(v))));

  return (
    <div className="venue-picker">
      <button className="picker-toggle" onClick={() => setShowPicker((p) => !p)}>
        {selectedSuburbs.length} suburb{selectedSuburbs.length !== 1 ? "s" : ""} ({selected.length} venue{selected.length !== 1 ? "s" : ""}) ▾
      </button>
      {showPicker && (
        <div className="picker-dropdown">
          <div className="picker-actions">
            <button onClick={selectAll}>Select All</button>
            <button onClick={selectNone}>Clear All</button>
          </div>
          {suburbs.map(([suburb, suburbVenues]) => {
            const keys = suburbVenues.map(keyFn);
            const checkedCount = keys.filter((k) => selected.includes(k)).length;
            const allChecked = checkedCount === keys.length;
            const someChecked = checkedCount > 0 && !allChecked;
            const isOpen = expanded[suburb] ?? false;

            return (
              <div key={suburb} className="suburb-group">
                <div className="suburb-header">
                  <button className="suburb-expand" onClick={() => toggleSuburb(suburb)}>
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <label className="suburb-label">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={() => toggleAllInSuburb(suburb, suburbVenues)}
                    />
                    <span className="suburb-name">{suburb}</span>
                    <span className="suburb-count">({suburbVenues.length})</span>
                  </label>
                </div>
                {isOpen && (
                  <div className="suburb-venues">
                    {suburbVenues.map((v) => (
                      <label key={v.id} className="picker-item">
                        <input
                          type="checkbox"
                          checked={selected.includes(v.id)}
                          onChange={() => toggleVenue(v.id)}
                        />
                        {v.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
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

function TvVenueGrid({ venue, date }) {
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
        <a href={`https://www.tennisvenues.com.au/booking/${venue.clientId}`} target="_blank" rel="noopener noreferrer" className="booking-link">Book &rarr;</a>
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
  const [showPicker, setShowPicker] = useState(false);

  const currentVenues = activeTab === "main" ? ALL_VENUES : TV_VENUES;
  const currentSelected = activeTab === "main" ? selected : tvSelected;
  const currentSetSelected = activeTab === "main" ? setSelected : setTvSelected;

  return (
    <div className="app">
      <header className="app-header">
        <h1>NSW Tennis Court Availability</h1>
        <div className="region-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`region-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => { setActiveTab(t.id); setShowPicker(false); }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="controls">
          <div className="date-control">
            <label htmlFor="date-input">Date:</label>
            <button className="date-arrow" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} title="Previous day">&larr;</button>
            <input
              id="date-input"
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
            />
            <button className="date-arrow" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} title="Next day">&rarr;</button>
          </div>
          <SuburbPicker
            venues={currentVenues}
            selected={currentSelected}
            setSelected={currentSetSelected}
            showPicker={showPicker}
            setShowPicker={setShowPicker}
          />
        </div>
        <div className="legend">
          <span className="legend-item"><span className="swatch swatch-available" /> Available</span>
          <span className="legend-item"><span className="swatch swatch-booked" /> Booked</span>
          {activeTab === "main" && (
            <span className="legend-item"><span className="swatch swatch-coaching" /> Coaching / Session</span>
          )}
          <span className="legend-item"><span className="swatch swatch-closed" /> Closed / Booked</span>
        </div>
      </header>
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
    </div>
  );
}
