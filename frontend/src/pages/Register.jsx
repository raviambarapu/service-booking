
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getError } from "../api";
import "./Register.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    if (form.password !== form.confirm) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medislot-register">
      {/* LEFT BLUE SECTION */}
      <section className="medislot-register-left">
        <div className="medislot-register-brand">
          <span className="medislot-register-logo">✚</span>
          <span>MediSlot</span>
        </div>

        <div className="medislot-register-hero">
          <span className="medislot-register-tag">
            YOUR HEALTH, OUR PRIORITY
          </span>

          <h1>
            Your health deserves
            <br />
            <span>the best care.</span>
          </h1>

          <p>
            Join MediSlot and experience a simpler way to book
            doctor appointments, manage your visits, and stay
            connected to better healthcare.
          </p>

          <div className="medislot-register-benefits">
            <div><span>✓</span> Find and book doctor appointments</div>
            <div><span>✓</span> Manage your bookings in one place</div>
            <div><span>✓</span> Simple, convenient scheduling</div>
          </div>

          <div className="medislot-register-illustration">
            <div className="medislot-register-medical-icon">✚</div>
            <div className="medislot-register-floating-card">
              <span className="medislot-register-floating-check">✓</span>
              <div>
                <strong>Easy appointments</strong>
                <small>Healthcare made simple</small>
              </div>
            </div>
          </div>
        </div>

        <div className="medislot-register-footer">
          Your wellness journey starts here.
        </div>
      </section>

      {/* RIGHT WHITE SECTION */}
      <section className="medislot-register-right">
        <div className="medislot-register-form-box">
          <div className="medislot-register-welcome">
            <span>WELCOME TO MEDISLOT</span>
            <h2>Create your account</h2>
            <p>Get started with better healthcare today.</p>
          </div>

          {error && (
            <div className="medislot-register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={form.name}
              onChange={handleChange}
            />

            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />

            <label htmlFor="register-password">Password</label>
            <div className="medislot-register-password">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label htmlFor="register-confirm">
              Confirm password
            </label>
            <input
              id="register-confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={form.confirm}
              onChange={handleChange}
            />

            <button
              className="medislot-register-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="medislot-register-login">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <div className="medislot-register-bottom">
            <span>✦</span> A simpler way to manage your healthcare
          </div>
        </div>
      </section>
    </div>
  );
}
