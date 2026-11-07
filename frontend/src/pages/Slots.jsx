import { useEffect, useState } from "react";
import api, { formatDateTime, getError } from "../api";

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type, text }

  const loadSlots = async () => {
    try {
      const { data } = await api.get("/slots", { params: { available_only: true } });
      setSlots(data);
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, []);

  const book = async (slotId) => {
    setMessage(null);
    try {
      await api.post("/bookings", { slot_id: slotId, notes: notes || null });
      setMessage({ type: "success", text: "Booking confirmed! See it under “My bookings”." });
      setNotes("");
      loadSlots();
    } catch (err) {
      setMessage({ type: "error", text: getError(err) });
      loadSlots();
    }
  };

  const visible = date
    ? slots.filter((s) => new Date(s.start_time).toLocaleDateString("en-CA") === date)
    : slots;

  return (
    <div>
      <h2>Available slots</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <div className="card filters">
        <div>
          <label htmlFor="date">Filter by date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grow">
          <label htmlFor="notes">Notes (optional)</label>
          <input id="notes" maxLength={300} placeholder="Reason for visit..." value={notes}
                 onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {loading ? <p>Loading...</p> : visible.length === 0 ? (
        <p className="muted">No available slots.</p>
      ) : (
        <div className="grid">
          {visible.map((s) => (
            <div className="card slot" key={s.id}>
              <strong>{formatDateTime(s.start_time)}</strong>
              <span className="muted">until {new Date(s.end_time).toLocaleTimeString([], { timeStyle: "short" })}</span>
              <button className="btn" onClick={() => book(s.id)}>Book</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
