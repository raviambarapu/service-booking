
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./MyBookings.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      // Customer booking history endpoint
      const response = await api.get("/bookings/my");

      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        "Booking history error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value) {
    if (!value) return "";

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const completedCount = bookings.filter(
    (b) => b.status?.toLowerCase() === "completed"
  ).length;

  const upcomingCount = bookings.filter(
    (b) => b.status?.toLowerCase() === "booked"
  ).length;

  return (
    <div className="mybookings-page">

      {/* HEADER */}
      <header className="mybookings-header">
        <Link to="/" className="mybookings-logo">
          <span className="logo-icon">✚</span>
          MediSlot
        </Link>

        <nav className="mybookings-nav">
          <Link to="/">Book a slot</Link>
          <Link to="/my-bookings" className="active">
            My bookings
          </Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="mybookings-container">

        <div className="mybookings-heading">
          <div>
            <span className="section-label">
              YOUR APPOINTMENTS
            </span>

            <h1>My bookings</h1>

            <p>
              Manage and track all your appointments in one place.
            </p>
          </div>

          <Link to="/" className="new-booking-btn">
            + Book an appointment
          </Link>
        </div>

        {/* STATISTICS */}
        <div className="booking-stats">
          <div className="booking-stat-card">
            <span>Total bookings</span>
            <h2>{bookings.length}</h2>
          </div>

          <div className="booking-stat-card">
            <span>Completed</span>
            <h2>{completedCount}</h2>
          </div>

          <div className="booking-stat-card">
            <span>Upcoming</span>
            <h2>{upcomingCount}</h2>
          </div>
        </div>

        {/* BOOKING HISTORY */}
        <section className="booking-list-section">

          <div className="booking-list-heading">
            <h2>Appointment history</h2>
            <span>{bookings.length} appointments</span>
          </div>

          {loading && (
            <p className="booking-message">
              Loading bookings...
            </p>
          )}

          {error && (
            <div className="booking-error">
              {error}
              <button onClick={loadBookings}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="empty-bookings">
              <div className="empty-icon">📅</div>

              <h3>No bookings yet</h3>

              <p>
                Your appointments will appear here after booking.
              </p>

              <Link to="/" className="new-booking-btn">
                Book your first appointment
              </Link>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="booking-cards">

              {bookings.map((booking) => {
                const status = booking.status || "booked";
                const slot = booking.slot || {};
                const date = slot.start_time || booking.start_time;

                return (
                  <article
                    className="booking-card"
                    key={booking.id}
                  >
                    <div className="booking-card-icon">
                      ✚
                    </div>

                    <div className="booking-card-details">
                      <h3>Doctor Appointment</h3>

                      <p>
                        <span>📅</span>
                        {formatDate(date)}
                      </p>

                      <p>
                        <span>🕒</span>
                        {formatTime(date)}
                      </p>

                      {booking.notes && (
                        <p>{booking.notes}</p>
                      )}
                    </div>

                    <div className="booking-card-right">
                      <span
                        className={`booking-status ${status.toLowerCase()}`}
                      >
                        {status.charAt(0).toUpperCase() +
                          status.slice(1)}
                      </span>

                      <small>
                        Booking #{booking.id}
                      </small>
                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default MyBookings;
