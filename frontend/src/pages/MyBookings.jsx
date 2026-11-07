import { useEffect, useState } from "react";
import api, { formatDateTime, getError } from "../api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [editing, setEditing] = useState(null); // booking id being rescheduled
  const [newSlot, setNewSlot] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [b, s] = await Promise.all([
        api.get("/bookings/my"),
        api.get("/slots", { params: { available_only: true } }),
      ]);
      setBookings(b.data);
      setSlots(s.data);
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      setMessage({ type: "success", text: "Booking cancelled" });
      load();
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    }
  };

  const reschedule = async (id) => {
    if (!newSlot) return setMessage({ type: "error", text: "Pick a new slot first" });
    try {
      await api.put(`/bookings/${id}/reschedule`, { slot_id: Number(newSlot) });
      setMessage({ type: "success", text: "Booking rescheduled" });
      setEditing(null);
      setNewSlot("");
      load();
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>My bookings</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      {bookings.length === 0 && <p className="muted">You have no bookings yet.</p>}
      <div className="list">
        {bookings.map((b) => (
          <div className="card booking" key={b.id}>
            <div>
              <strong>{formatDateTime(b.slot.start_time)}</strong>
              <span className={`badge badge-${b.status}`}>{b.status}</span>
              {b.notes && <p className="muted">{b.notes}</p>}
            </div>
            {b.status === "booked" && (
              <div className="actions">
                {editing === b.id ? (
                  <>
                    <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
                      <option value="">Select new slot</option>
                      {slots.map((s) => <option key={s.id} value={s.id}>{formatDateTime(s.start_time)}</option>)}
                    </select>
                    <button className="btn" onClick={() => reschedule(b.id)}>Save</button>
                    <button className="btn btn-outline" onClick={() => setEditing(null)}>Close</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-outline" onClick={() => setEditing(b.id)}>Reschedule</button>
                    <button className="btn btn-danger" onClick={() => cancel(b.id)}>Cancel</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
