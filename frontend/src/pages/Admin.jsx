
import { useEffect, useMemo, useState } from "react";
import api, { formatDateTime, getError } from "../api";
import "./Admin.css";

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Admin() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ start: "", end: "" });
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [slotResponse, bookingResponse] = await Promise.all([
        api.get("/slots"),
        api.get("/bookings"),
      ]);

      setSlots(
        Array.isArray(slotResponse.data) ? slotResponse.data : []
      );

      setBookings(
        Array.isArray(bookingResponse.data)
          ? bookingResponse.data
          : []
      );
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action, success) {
    setMessage(null);

    try {
      await action();
      setMessage({ type: "success", text: success });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    }
  }

  function createSlot(event) {
    event.preventDefault();

    if (!form.start || !form.end) {
      setMessage({
        type: "error",
        text: "Please select both start and end times.",
      });
      return;
    }

    if (new Date(form.end) <= new Date(form.start)) {
      setMessage({
        type: "error",
        text: "End time must be after start time.",
      });
      return;
    }

    run(async () => {
      await api.post("/slots", {
        start_time: new Date(form.start).toISOString(),
        end_time: new Date(form.end).toISOString(),
      });

      setForm({ start: "", end: "" });
    }, "Appointment slot created successfully.");
  }

  const stats = useMemo(() => {
    const now = new Date();

    const upcoming = bookings.filter((booking) => {
      const start = safeDate(booking.slot?.start_time);

      return (
        booking.status === "booked" &&
        start &&
        start >= now
      );
    }).length;

    const completed = bookings.filter(
      (booking) => booking.status === "completed"
    ).length;

    const cancelled = bookings.filter(
      (booking) => booking.status === "cancelled"
    ).length;

    const customers = new Set(
      bookings.map((booking) => booking.user?.id).filter(Boolean)
    ).size;

    return {
      total: bookings.length,
      upcoming,
      completed,
      cancelled,
      customers,
    };
  }, [bookings]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);

    bookings.forEach((booking) => {
      const date = safeDate(booking.slot?.start_time);

      if (date) counts[date.getDay()] += 1;
    });

    const today = new Date().getDay();

    return days.map((day, index) => {
      const actualIndex = (today - 6 + index + 7) % 7;

      return {
        day,
        count: counts[actualIndex],
      };
    });
  }, [bookings]);

  const maxWeeklyCount = Math.max(
    ...weeklyData.map((item) => item.count),
    1
  );

  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.toLowerCase();

    return (
      (booking.user?.name || "").toLowerCase().includes(searchText) ||
      (booking.user?.email || "").toLowerCase().includes(searchText) ||
      (booking.status || "").toLowerCase().includes(searchText)
    );
  });

  const recentBookings = [...filteredBookings].sort((a, b) => {
    const dateA = safeDate(a.slot?.start_time)?.getTime() || 0;
    const dateB = safeDate(b.slot?.start_time)?.getTime() || 0;

    return dateB - dateA;
  });

  // Build customer list from the users included in bookings.
  const customers = useMemo(() => {
    const customerMap = new Map();

    bookings.forEach((booking) => {
      const customer = booking.user;

      if (!customer?.id) return;

      if (!customerMap.has(customer.id)) {
        customerMap.set(customer.id, {
          ...customer,
          bookingCount: 1,
        });
      } else {
        customerMap.get(customer.id).bookingCount += 1;
      }
    });

    return Array.from(customerMap.values());
  }, [bookings]);

  function navigateTo(tab, sectionId) {
    setActiveTab(tab);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function getDate(value) {
    const date = safeDate(value);

    return date
      ? date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  }

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <a
          className="admin-brand"
          href="/admin"
        >
          <span className="brand-icon">✚</span>
          <span>MediSlot</span>
        </a>

        <div className="sidebar-label">
          MAIN MENU
        </div>

        <button
          className={`sidebar-link ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => navigateTo("dashboard", "dashboard")}
        >
          <span className="nav-icon">▦</span>
          Dashboard
        </button>

        <button
          className={`sidebar-link ${
            activeTab === "appointments" ? "active" : ""
          }`}
          onClick={() => navigateTo("appointments", "appointments")}
        >
          <span className="nav-icon">▣</span>
          Appointments
        </button>

        <button
          className={`sidebar-link ${
            activeTab === "slots" ? "active" : ""
          }`}
          onClick={() => navigateTo("slots", "slots")}
        >
          <span className="nav-icon">▤</span>
          Availability
        </button>

        <button
          className={`sidebar-link ${
            activeTab === "customers" ? "active" : ""
          }`}
          onClick={() => navigateTo("customers", "customers")}
        >
          <span className="nav-icon">♙</span>
          Customers
        </button>

        <div className="sidebar-label sidebar-bottom-label">
          MANAGEMENT
        </div>

        <button
          className={`sidebar-link ${
            activeTab === "reports" ? "active" : ""
          }`}
          onClick={() => navigateTo("reports", "analytics")}
        >
          <span className="nav-icon">▥</span>
          Reports
        </button>

        <div className="sidebar-help">
          <div className="help-icon">✦</div>
          <strong>Need help?</strong>
          <p>
            Manage your appointments and availability from one place.
          </p>
        </div>

        <div className="sidebar-version">
          MEDISLOT ADMIN · 2026
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        <header className="admin-topbar">
          <div>
            <p className="topbar-small">
              Workspace / Admin
            </p>
            <h2>Appointment Management</h2>
          </div>

          <div className="topbar-right">
            <span className="admin-online-dot"></span>
            <span>Admin Dashboard</span>
          </div>
        </header>

        <div className="admin-content">

          {message && (
            <div className={`admin-alert ${message.type}`}>
              <span>{message.text}</span>

              <button
                type="button"
                onClick={() => setMessage(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* DASHBOARD HEADING */}
          <section
            id="dashboard"
            className="dashboard-heading"
          >
            <div>
              <span className="section-kicker">
                OVERVIEW
              </span>

              <h1>Dashboard Overview</h1>

              <p>
                Here's what's happening with your appointments.
              </p>
            </div>

            <span className="dashboard-date">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </section>

          {/* STATISTICS */}
          <section className="stats-grid">

            <article className="stat-card">
              <div className="stat-top">
                <span>Total Appointments</span>
                <span className="stat-icon blue">▣</span>
              </div>

              <h2>{stats.total}</h2>
              <p>All recorded bookings</p>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Upcoming</span>
                <span className="stat-icon orange">◷</span>
              </div>

              <h2>{stats.upcoming}</h2>
              <p>Future booked appointments</p>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Completed</span>
                <span className="stat-icon green">✓</span>
              </div>

              <h2>{stats.completed}</h2>
              <p>Successfully completed</p>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Total Customers</span>
                <span className="stat-icon violet">♙</span>
              </div>

              <h2>{stats.customers}</h2>
              <p>Unique booked customers</p>
            </article>

          </section>

          {/* CHARTS */}
          <section
            id="analytics"
            className="analytics-grid"
          >

            <div className="admin-panel chart-panel">

              <div className="panel-heading">
                <div>
                  <h3>Appointment Statistics</h3>
                  <p>Bookings by weekday</p>
                </div>

                <span className="chart-legend">
                  <i></i> Appointments
                </span>
              </div>

              <div className="weekly-chart">
                {weeklyData.map((item) => (
                  <div
                    className="chart-column"
                    key={item.day}
                  >

                    <span className="chart-value">
                      {item.count}
                    </span>

                    <div className="chart-bar-area">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(
                            (item.count / maxWeeklyCount) * 100,
                            3
                          )}%`,
                        }}
                      ></div>
                    </div>

                    <span className="chart-day">
                      {item.day}
                    </span>

                  </div>
                ))}
              </div>
            </div>

            <div className="admin-panel summary-panel">

              <h3>Booking Summary</h3>
              <p className="panel-subtitle">
                Current booking status
              </p>

              {[
                {
                  label: "Upcoming",
                  value: stats.upcoming,
                  dot: "purple-dot",
                  fill: "purple-fill",
                },
                {
                  label: "Completed",
                  value: stats.completed,
                  dot: "green-dot",
                  fill: "green-fill",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelled,
                  dot: "red-dot",
                  fill: "red-fill",
                },
              ].map((item) => (
                <div
                  className="summary-item"
                  key={item.label}
                >

                  <div className="summary-row">
                    <span>
                      <i className={`summary-dot ${item.dot}`}></i>
                      {item.label}
                    </span>

                    <strong>{item.value}</strong>
                  </div>

                  <div className="summary-track">
                    <div
                      className={`summary-fill ${item.fill}`}
                      style={{
                        width: `${
                          stats.total
                            ? (item.value / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* QUICK ACTIONS */}
          <section className="quick-actions-section">

            <div className="section-title-row">
              <div>
                <h2>Quick Actions</h2>
                <p>Jump straight to the tasks you use most.</p>
              </div>
            </div>

            <div className="quick-actions-grid">

              <button
                className="quick-action-card"
                onClick={() => navigateTo("slots", "slots")}
              >
                <span className="quick-action-icon blue-bg">＋</span>

                <span>
                  <strong>Create Slot</strong>
                  <small>Add a new appointment time</small>
                </span>

                <b>→</b>
              </button>

              <button
                className="quick-action-card"
                onClick={() =>
                  navigateTo("appointments", "appointments")
                }
              >
                <span className="quick-action-icon purple-bg">▣</span>

                <span>
                  <strong>View Appointments</strong>
                  <small>Review customer bookings</small>
                </span>

                <b>→</b>
              </button>

              <button
                className="quick-action-card"
                onClick={() => navigateTo("slots", "slots")}
              >
                <span className="quick-action-icon green-bg">▤</span>

                <span>
                  <strong>Manage Availability</strong>
                  <small>Check and remove time slots</small>
                </span>

                <b>→</b>
              </button>

            </div>
          </section>

          {/* APPOINTMENTS */}
          <section
            id="appointments"
            className="admin-panel activity-panel"
          >

            <div className="panel-heading activity-heading">

              <div>
                <h3>Recent Appointments</h3>
                <p>Manage and monitor customer bookings</p>
              </div>

              <input
                className="booking-search"
                type="search"
                placeholder="Search customer or status..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Appointment Date</th>
                    <th>Appointment Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>

                      <td>
                        <strong>
                          {booking.user?.name || "Customer"}
                        </strong>

                        <small>
                          {booking.user?.email || ""}
                        </small>
                      </td>

                      <td>
                        {getDate(booking.slot?.start_time)}
                      </td>

                      <td>
                        {booking.slot?.start_time
                          ? formatDateTime(booking.slot.start_time)
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`status-pill status-${
                            booking.status || "unknown"
                          }`}
                        >
                          {booking.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">

                          {booking.status === "booked" && (
                            <>
                              <button
                                type="button"
                                className="action-complete"
                                onClick={() =>
                                  run(
                                    () =>
                                      api.patch(
                                        `/bookings/${booking.id}/status`,
                                        { status: "completed" }
                                      ),
                                    "Booking marked completed."
                                  )
                                }
                              >
                                Complete
                              </button>

                              <button
                                type="button"
                                className="action-cancel"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Cancel this booking?"
                                    )
                                  ) {
                                    run(
                                      () =>
                                        api.delete(
                                          `/bookings/${booking.id}`
                                        ),
                                      "Booking cancelled."
                                    );
                                  }
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                  {!loading && recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-table">
                        No appointments found.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan="5" className="empty-table">
                        Loading appointments...
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

          </section>

          {/* CUSTOMERS */}
          <section
            id="customers"
            className="admin-panel activity-panel"
          >

            <div className="panel-heading">
              <div>
                <h3>Registered Customers</h3>
                <p>
                  Customers who have booked appointments
                </p>
              </div>

              <span>{customers.length} customers</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Total Bookings</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>#{customer.id}</td>

                      <td>
                        <strong>
                          {customer.name || "Customer"}
                        </strong>
                      </td>

                      <td>
                        {customer.email || "—"}
                      </td>

                      <td>
                        {customer.bookingCount}
                      </td>
                    </tr>
                  ))}

                  {!loading && customers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-table">
                        No customers found.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

          </section>

          {/* AVAILABILITY MANAGEMENT */}
          <section
            id="slots"
            className="admin-panel slot-panel"
          >

            <div className="panel-heading">
              <div>
                <h3>Manage Availability</h3>
                <p>
                  Create and manage appointment time slots
                </p>
              </div>
            </div>

            <form
              className="slot-form"
              onSubmit={createSlot}
            >

              <div>
                <label htmlFor="start">
                  Start date and time
                </label>

                <input
                  id="start"
                  type="datetime-local"
                  required
                  value={form.start}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      start: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="end">
                  End date and time
                </label>

                <input
                  id="end"
                  type="datetime-local"
                  required
                  value={form.end}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      end: event.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="add-slot-button"
              >
                ＋ Create Slot
              </button>

            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Start</th>
                    <th>End</th>
                    <th>Availability</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id}>

                      <td>
                        {formatDateTime(slot.start_time)}
                      </td>

                      <td>
                        {formatDateTime(slot.end_time)}
                      </td>

                      <td>
                        <span
                          className={`status-pill ${
                            slot.is_available
                              ? "status-available"
                              : "status-booked"
                          }`}
                        >
                          {slot.is_available
                            ? "Available"
                            : "Booked"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="action-cancel"
                          onClick={() => {
                            if (
                              window.confirm("Delete this slot?")
                            ) {
                              run(
                                () =>
                                  api.delete(`/slots/${slot.id}`),
                                "Slot deleted."
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))}

                  {!loading && slots.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-table">
                        No slots created yet.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

          </section>

          <footer className="admin-footer">
            MediSlot Appointment Management · Admin Workspace
          </footer>

        </div>
      </main>
    </div>
  );
}
