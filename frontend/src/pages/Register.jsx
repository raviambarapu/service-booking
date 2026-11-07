import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getError } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Create account</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" required minLength={2} value={form.name} onChange={handleChange} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} />
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" required value={form.confirm} onChange={handleChange} />
        <button className="btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}
