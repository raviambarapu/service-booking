
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api, { getError } from "../api";
import { useAuth } from "../AuthContext";
import "./Slots.css";

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLocalDate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Slots() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSlots() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/slots");

      setSlots(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  const availableSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Exclude already-booked slots.
      if (slot.is_available === false) return false;

      // Date filter.
      if (
        selectedDate &&
        getLocalDate(slot.start_time) !== selectedDate
      ) {
        return false;
      }

      // Search by slot ID or time.
      if (search.trim()) {
        const query = search.toLowerCase();

        const searchable = [
          String(slot.id),
          formatTime(slot.start_time),
          formatTime(slot.end_time),
        ].join(" ").toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [slots, selectedDate, search]);

  const groupedSlots = useMemo(() => {
    return availableSlots.reduce((groups, slot) => {
      const date = getLocalDate(slot.start_time);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(slot);

      return groups;
    }, {});
  }, [availableSlots]);

  async function handleBooking(slot) {
    if (!slot) {
      setError("Please select an appointment slot.");
      return;
    }

    try {
      setBooking(true);
      setError("");
      setMessage("");

      await api.post("/bookings", {
        slot_id: slot.id,
        notes: notes.trim(),
      });

      setMessage(
        `Appointment for ${formatDate(slot.start_time)} at ${formatTime(slot.start_time)} booked successfully!`
      );

      setSelectedSlot(null);
      setNotes("");

      await loadSlots();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBooking(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="medislot-dashboard">

      {/* SIDEBAR */}
      <aside className="medislot-sidebar">

        <NavLink to="/slots" className="medislot-side-logo">
          <span className="medislot-side-logo-icon">✚</span>
          <span>MediSlot</span>
        </NavLink>

        <div className="medislot-side-label">
          MAIN MENU
        </div>

        <nav className="medislot-side-nav">

          <NavLink to="/slots" className="medislot-nav-link">
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/slots"
            end
            className={({ isActive }) =>
              `medislot-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>▣</span>
            Available Slots
          </NavLink>

          <NavLink to="/my-bookings" className="medislot-nav-link">
            <span>▤</span>
            My Bookings
          </NavLink>

        </nav>

        <div className="medislot-sidebar-bottom">

          <div className="medislot-help-card">
            <span>Need help?</span>
            <p>Choose a convenient appointment time.</p>
          </div>

          <button
            className="medislot-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="medislot-content">

        {/* TOPBAR */}
        <header className="medislot-topbar">

          <div>
            <span className="medislot-topbar-label">
              PATIENT PORTAL
            </span>
            <h2>Available Slots</h2>
          </div>

          <div className="medislot-profile">
            <div className="medislot-notification">♧</div>

            <div className="medislot-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="medislot-profile-info">
              <strong>{user?.name || "Patient"}</strong>
              <span>Patient</span>
            </div>
          </div>

        </header>

        {/* WELCOME */}
        <section className="medislot-welcome-card">
          <div>
            <span>YOUR HEALTH, OUR PRIORITY</span>
            <h1>Find your perfect appointment.</h1>
            <p>
              Choose an available time slot and book your
              appointment in just a few clicks.
            </p>
          </div>

          <div className="medislot-welcome-icon">
            ✚
          </div>
        </section>

        {/* STATISTICS */}
        <section className="medislot-slot-stats">

          <div className="medislot-stat-card">
            <div className="medislot-stat-icon blue">▦</div>
            <div>
              <span>Available Slots</span>
              <h3>{availableSlots.length}</h3>
            </div>
          </div>

          <div className="medislot-stat-card">
            <div className="medislot-stat-icon green">✓</div>
            <div>
              <span>Selected Slot</span>
              <h3>{selectedSlot ? "1" : "0"}</h3>
            </div>
          </div>

          <div className="medislot-stat-card">
            <div className="medislot-stat-icon purple">◷</div>
            <div>
              <span>Appointment Days</span>
              <h3>{Object.keys(groupedSlots).length}</h3>
            </div>
          </div>

        </section>

        {/* SEARCH AND FILTER */}
        <section className="medislot-filter-card">

          <div className="medislot-section-heading">
            <div>
              <h2>Book an Appointment</h2>
              <p>Select your preferred date and time.</p>
            </div>

            <button
              className="medislot-refresh"
              onClick={loadSlots}
              disabled={loading}
              type="button"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="medislot-filters">

            <div className="medislot-filter-field">
              <label htmlFor="slot-date">Select Date</label>
              <input
                id="slot-date"
                type="date"
                min={getLocalDate(new Date())}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                  setMessage("");
                  setError("");
                }}
              />
            </div>

            <div className="medislot-filter-field search-field">
              <label htmlFor="slot-search">Search Slot</label>
              <input
                id="slot-search"
                type="search"
                placeholder="Search by slot ID or time..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="medislot-clear-filter"
              onClick={() => {
                setSelectedDate("");
                setSearch("");
                setSelectedSlot(null);
                setError("");
                setMessage("");
              }}
            >
              Clear filters
            </button>

          </div>

        </section>

        {/* AVAILABLE SLOT LIST */}
        <section className="medislot-available-section">

          <div className="medislot-section-heading">
            <div>
              <h2>Available Appointments</h2>
              <p>Choose a time that works best for you.</p>
            </div>

            <span className="medislot-count">
              {availableSlots.length} slots found
            </span>
          </div>

          {loading && (
            <div className="medislot-empty">
              Loading available appointments...
            </div>
          )}

          {!loading && error && !slots.length && (
            <div className="medislot-error">
              {error}
              <button type="button" onClick={loadSlots}>
                Try again
              </button>
            </div>
          )}

          {!loading && availableSlots.length === 0 && (
            <div className="medislot-empty">
              <span>📅</span>
              <h3>No available appointments</h3>
              <p>Try another date or clear your filters.</p>
            </div>
          )}

          {!loading && availableSlots.length > 0 && (
            <div className="medislot-slot-groups">

              {Object.entries(groupedSlots)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, daySlots]) => (

                  <div className="medislot-day-group" key={date}>

                    <div className="medislot-day-heading">
                      <span className="medislot-day-icon">▦</span>
                      <h3>{formatDate(daySlots[0].start_time)}</h3>
                      <span>{daySlots.length} available</span>
                    </div>

                    <div className="medislot-slot-grid">

                      {daySlots
                        .sort(
                          (a, b) =>
                            new Date(a.start_time) -
                            new Date(b.start_time)
                        )
                        .map((slot) => {

                          const selected =
                            selectedSlot?.id === slot.id;

                          return (
                            <article
                              key={slot.id}
                              className={`medislot-slot-card ${
                                selected ? "selected" : ""
                              }`}
                            >

                              <div className="medislot-slot-card-top">
                                <span className="medislot-slot-number">
                                  SLOT #{slot.id}
                                </span>

                                <span className="medislot-available-badge">
                                  Available
                                </span>
                              </div>

                              <div className="medislot-slot-time">
                                <span>◷</span>
                                <strong>
                                  {formatTime(slot.start_time)}
                                </strong>
                              </div>

                              <p className="medislot-slot-duration">
                                Until {formatTime(slot.end_time)}
                              </p>

                              <button
                                type="button"
                                className={
                                  selected
                                    ? "medislot-book-button chosen"
                                    : "medislot-book-button"
                                }
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setMessage("");
                                  setError("");
                                }}
                              >
                                {selected ? "Selected ✓" : "Select Slot"}
                              </button>

                            </article>
                          );
                        })}

                    </div>
                  </div>
                ))}

            </div>
          )}

        </section>

        {/* BOOKING CONFIRMATION */}
        {selectedSlot && (
          <section className="medislot-confirm-card">

            <div className="medislot-confirm-info">
              <span>YOUR SELECTED APPOINTMENT</span>
              <h3>Slot #{selectedSlot.id}</h3>
              <p>
                {formatDate(selectedSlot.start_time)}
              </p>
              <strong>
                {formatTime(selectedSlot.start_time)} –{" "}
                {formatTime(selectedSlot.end_time)}
              </strong>
            </div>

            <div className="medislot-confirm-form">
              <label htmlFor="slot-notes">
                Additional notes (optional)
              </label>

              <textarea
                id="slot-notes"
                rows="2"
                placeholder="Reason for your appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                type="button"
                className="medislot-confirm-button"
                disabled={booking}
                onClick={() => handleBooking(selectedSlot)}
              >
                {booking ? "Booking..." : "Book Now →"}
              </button>
            </div>

          </section>
        )}

        {message && (
          <div className="medislot-success" role="status">
            ✓ {message}
            <NavLink to="/my-bookings">
              View My Bookings →
            </NavLink>
          </div>
        )}

        {error && slots.length > 0 && (
          <div className="medislot-error" role="alert">
            {error}
          </div>
        )}

        <footer className="medislot-page-footer">
          <span>© MediSlot 2026</span>
          <span>Simple · Secure · Convenient</span>
        </footer>

      </main>
    </div>
  );
}
