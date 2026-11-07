import { useEffect, useState } from "react";
import api, { formatDateTime, getError } from "../api";

export default function Admin() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ start: "", end: "" });
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const [s, b] = await Promise.all([api.get("/slots"), api.get("/bookings")]);
      setSlots(s.data);
      setBookings(b.data);
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (fn, success) => {
    setMessage(null);
    try {
      await fn();
      setMessage({ type: "success", text: success });
      load();
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    }
  };

  const createSlot = (e) => {
    e.preventDefault();
    // datetime-local is local time -> send as UTC ISO
    run(async () => {
      await api.post("/slots", {
        start_time: new Date(form.start).toISOString(),
        end_time: new Date(form.end).toISOString(),
      });
      setForm({ start: "", end: "" });
    }, "Slot created");
  };

  return (
    <div>
      <h2>Admin dashboard</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <section className="card">
        <h3>Create slot</h3>
        <form className="inline-form" onSubmit={createSlot}>
          <div>
            <label htmlFor="start">Start</label>
            <input id="start" type="datetime-local" required value={form.start}
                   onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <label htmlFor="end">End</label>
            <input id="end" type="datetime-local" required value={form.end}
                   onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <button className="btn" type="submit">Add slot</button>
        </form>
      </section>

      <h3>All slots</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.start_time)}</td>
                <td>{formatDateTime(s.end_time)}</td>
                <td><span className={`badge ${s.is_available ? "badge-completed" : "badge-booked"}`}>
                  {s.is_available ? "available" : "booked"}</span></td>
                <td><button className="btn btn-danger" onClick={() => {
                  if (window.confirm("Delete this slot?")) run(() => api.delete(`/slots/${s.id}`), "Slot deleted");
                }}>Delete</button></td>
              </tr>
            ))}
            {slots.length === 0 && <tr><td colSpan="4" className="muted">No slots yet</td></tr>}
          </tbody>
        </table>
      </div>

      <h3>All bookings</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Slot</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.user.name}<br /><small className="muted">{b.user.email}</small></td>
                <td>{formatDateTime(b.slot.start_time)}</td>
                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                <td className="actions">
                  {b.status === "booked" && (
                    <>
                      <button className="btn" onClick={() => run(() => api.patch(`/bookings/${b.id}/status`, { status: "completed" }), "Marked completed")}>Complete</button>
                      <button className="btn btn-danger" onClick={() => run(() => api.delete(`/bookings/${b.id}`), "Booking cancelled")}>Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan="4" className="muted">No bookings yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
