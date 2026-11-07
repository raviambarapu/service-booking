import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getError } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Login</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} />
        <button className="btn" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
      </form>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
