import { useState, useEffect, useCallback, useMemo } from "react";
import { NSW_VENUES, HILLS_VENUES } from "./venues";
import "./App.css";

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
      if (s.category === 1000) {
        return { status: "booked", label: s.name, colour: s.colour || "#fcfabd" };
      }
      if (s.category === 0 && s.capacity > 0) {
        return { status: "available", label: `$${s.cost.toFixed(2)}`, colour: null };
      }
      if (s.category === 2) {
        return { status: "coaching", label: s.name, colour: s.colour || "#c3e6cb" };
      }
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

// ─── Tennis Australia venue grid (play.tennis.com.au) ───

function TennisAuGrid({ venue, date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const dateStr = formatDate(date);
    const url = `${TENNIS_AU_API}/${venue.slug}/GetVenueSessions?resourceID=&startDate=${dateStr}&endDate=${dateStr}&roleId=&_=${Date.now()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [venue.slug, date]);

  if (loading) return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error) return <div className="venue-error">{venue.name}: {error}</div>;
  if (!data?.Resources?.length)
    return <div className="venue-error">{venue.name}: No data available</div>;

  const earliest = data.EarliestStartTime;
  const latest = data.LatestEndTime;
  const interval = data.MinimumInterval || 30;
  const timeSlots = [];
  for (let t = earliest; t < latest; t += interval) timeSlots.push(t);

  const resources = data.Resources;

  const bookingUrl = `https://play.tennis.com.au/${venue.slug}/Booking/BookByDate`;

  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venue.name}
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="booking-link">Book &rarr;</a>
      </h2>
      <div className="table-wrapper">
        <table className="availability-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {resources.map((r) => (
                <th key={r.ID} className="court-header">{r.Name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="time-cell">{minutesToTime(slot)}</td>
                {resources.map((r) => {
                  const sessions = (r.Days?.[0]?.Sessions || []).map(parseSession);
                  const info = getStatusForSlot(sessions, slot);
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

// ─── Hills Shire venue grid (bookable.net.au) ───

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

    const courtsUrl = `${HILLS_API}/venues/${venue.venueId}/bookables`;
    const bookingsUrl = `${HILLS_API}/venues/${venue.venueId}/bookingbookablesinperiod?fromDate=${dateStr}&toDate=${nextDateStr}&hideCancelledBooking=true&hideClosure=false&hideWorkBooking=false&hideBookableWorkBooking=true&excludeResource=true&hideRequestOrApplication=true&applyOnlyShowConfirmedBooking=true`;
    const hoursUrl = `${HILLS_API}/venues/${venue.venueId}/getbaseopeninghourslist`;

    Promise.all([
      fetch(courtsUrl, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(bookingsUrl, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch(hoursUrl, { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([courtsData, bookingsData, hoursData]) => {
        if (cancelled) return;
        const tennisCourts = courtsData.filter(
          (b) => b.Name?.includes("Tennis") || b.Name?.includes("Court")
        );
        setCourts(tennisCourts);
        setBookings(bookingsData);
        setHours(hoursData);
      })
      .catch((err) => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [venue.venueId, date]);

  if (loading) return <div className="venue-loading">Loading {venue.name}...</div>;
  if (error) return <div className="venue-error">{venue.name}: {error}</div>;
  if (!courts?.length)
    return <div className="venue-error">{venue.name}: No courts found</div>;

  const dateStr = formatDate(date);
  const dayBookings = (bookings || []).filter((b) =>
    b.Start_Date?.startsWith(dateStr)
  );

  let openMinutes = 7 * 60;
  let closeMinutes = 22 * 60;

  if (hours?.length) {
    const dayOfWeek = date.getDay();
    const dayHours = hours.find((h) => h.DayOfWeek === dayOfWeek || h.dayOfWeek === dayOfWeek);
    if (dayHours) {
      const open = dayHours.OpenTime || dayHours.openTime;
      const close = dayHours.CloseTime || dayHours.closeTime;
      if (open) {
        const parts = open.split(":");
        openMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
      }
      if (close) {
        const parts = close.split(":");
        closeMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
      }
    }
  }

  const interval = 30;
  const timeSlots = [];
  for (let t = openMinutes; t < closeMinutes; t += interval) {
    timeSlots.push(t);
  }

  const bookingsByCourtId = {};
  for (const b of dayBookings) {
    const key = b.ItemID;
    if (!bookingsByCourtId[key]) bookingsByCourtId[key] = [];
    bookingsByCourtId[key].push({
      start: timeToMinutes(b.Start_Date),
      end: timeToMinutes(b.End_Date),
      name: b.BookingStatusName || "Booked",
    });
  }

  function getHillsStatus(court, slotStart) {
    const courtBookings = bookingsByCourtId[court.ItemID] || [];
    for (const b of courtBookings) {
      if (slotStart >= b.start && slotStart < b.end) {
        return { status: "booked", label: "Booked", colour: null };
      }
    }
    if (slotStart >= openMinutes && slotStart < closeMinutes) {
      const rate = court.HourlyRate || 21;
      const cost = (rate * interval) / 60;
      return { status: "available", label: `$${cost.toFixed(2)}`, colour: null };
    }
    return { status: "closed", label: "", colour: null };
  }

  const bookingUrl = `https://hills.bookable.net.au/venues/${venue.venueId}`;

  return (
    <div className="venue-block">
      <h2 className="venue-title">
        {venue.name}
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="booking-link">Book &rarr;</a>
      </h2>
      <div className="table-wrapper">
        <table className="availability-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {courts.map((c) => (
                <th key={c.ItemID} className="court-header">{c.Name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                <td className="time-cell">{minutesToTime(slot)}</td>
                {courts.map((c) => {
                  const info = getHillsStatus(c, slot);
                  return <StatusCell key={c.ItemID} info={info} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Suburb-grouped venue picker ───

function groupBySuburb(venues) {
  const map = new Map();
  for (const v of venues) {
    const suburb = v.suburb || "Other";
    if (!map.has(suburb)) map.set(suburb, []);
    map.get(suburb).push(v);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function SuburbPicker({ venues, selected, setSelected, keyFn, showPicker, setShowPicker }) {
  const [expanded, setExpanded] = useState({});
  const suburbs = useMemo(() => groupBySuburb(venues), [venues]);

  const toggleSuburb = (suburb) =>
    setExpanded((prev) => ({ ...prev, [suburb]: !prev[suburb] }));

  const toggleVenue = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const toggleAllInSuburb = (suburb, suburbVenues) => {
    const keys = suburbVenues.map(keyFn);
    const allSelected = keys.every((k) => selected.includes(k));
    if (allSelected) {
      setSelected((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const selectAll = () => setSelected(venues.map(keyFn));
  const selectNone = () => setSelected([]);

  const selectedSuburbs = suburbs.filter(([, vens]) =>
    vens.some((v) => selected.includes(keyFn(v)))
  );

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
                  <button
                    className="suburb-expand"
                    onClick={() => toggleSuburb(suburb)}
                  >
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
                    {suburbVenues.map((v) => {
                      const key = keyFn(v);
                      return (
                        <label key={key} className="picker-item">
                          <input
                            type="checkbox"
                            checked={selected.includes(key)}
                            onChange={() => toggleVenue(key)}
                          />
                          {v.name}
                        </label>
                      );
                    })}
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

// ─── App ───

const REGIONS = [
  { id: "nsw", label: "NSW (Tennis Australia)" },
  { id: "hills", label: "Hills Shire (Baulkham Hills)" },
];

export default function App() {
  const [activeRegion, setActiveRegion] = useState("nsw");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [nswSelected, setNswSelected] = useState(NSW_VENUES.map((v) => v.slug));
  const [hillsSelected, setHillsSelected] = useState(HILLS_VENUES.map((v) => v.venueId));

  const [showPicker, setShowPicker] = useState(false);

  const venues = activeRegion === "nsw" ? NSW_VENUES : HILLS_VENUES;
  const selected = activeRegion === "nsw" ? nswSelected : hillsSelected;
  const setSelected = activeRegion === "nsw" ? setNswSelected : setHillsSelected;
  const keyFn = activeRegion === "nsw" ? (v) => v.slug : (v) => v.venueId;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tennis Court Availability</h1>

        <div className="region-tabs">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              className={`region-tab ${activeRegion === r.id ? "active" : ""}`}
              onClick={() => { setActiveRegion(r.id); setShowPicker(false); }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="controls">
          <div className="date-control">
            <label htmlFor="date-input">Date:</label>
            <input
              id="date-input"
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
            />
          </div>
          <SuburbPicker
            venues={venues}
            selected={selected}
            setSelected={setSelected}
            keyFn={keyFn}
            showPicker={showPicker}
            setShowPicker={setShowPicker}
          />
        </div>

        <div className="legend">
          <span className="legend-item">
            <span className="swatch swatch-available" /> Available
          </span>
          <span className="legend-item">
            <span className="swatch swatch-booked" /> Booked
          </span>
          {activeRegion === "nsw" && (
            <span className="legend-item">
              <span className="swatch swatch-coaching" /> Coaching / Session
            </span>
          )}
          <span className="legend-item">
            <span className="swatch swatch-closed" /> Closed
          </span>
        </div>
      </header>

      <main className="venue-list">
        {activeRegion === "nsw" &&
          NSW_VENUES.filter((v) => nswSelected.includes(v.slug)).map((v) => (
            <TennisAuGrid key={v.slug} venue={v} date={selectedDate} />
          ))}

        {activeRegion === "hills" &&
          HILLS_VENUES.filter((v) => hillsSelected.includes(v.venueId)).map((v) => (
            <HillsVenueGrid key={v.venueId} venue={v} date={selectedDate} />
          ))}
      </main>
    </div>
  );
}
