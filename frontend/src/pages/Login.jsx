
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getError } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // Login using backend API
      const loggedInUser = await login(
        form.email.trim(),
        form.password
      );

      // Check user role
      const role = String(
        loggedInUser.role || ""
      ).toLowerCase();

      // Navigate based on role
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/slots", { replace: true });
      }

    } catch (err) {
      setError(
        getError(err) || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bookit-login-page">

      {/* Navbar */}
      <nav className="login-navbar">
        <Link to="/login" className="login-brand">
          <span className="login-brand-icon">✚</span>
          Doctor's Appointment Booking
        </Link>

        <div className="login-nav-right">
          <span>MediSlot</span>

          <Link to="/register" className="login-signup-link">
            Create account
          </Link>
        </div>
      </nav>

      <main className="login-main">

        {/* Left Section */}
        <section className="login-visual">
          <div className="visual-content">

            <span className="visual-tag">
              YOUR HEALTH, OUR PRIORITY
            </span>

            <h1>
              Better care.
              <br />
              Easier appointments.
            </h1>

            <p>
              Take control of your schedule. Find available appointments
              and book your preferred time in just a few clicks.
            </p>

            <div className="visual-features">
              <div>
                <span>✓</span>
                Easy appointment booking
              </div>

              <div>
                <span>✓</span>
                Flexible time slots
              </div>

              <div>
                <span>✓</span>
                Manage your bookings
              </div>
            </div>

          </div>

          <div className="visual-decoration decoration-one"></div>
          <div className="visual-decoration decoration-two"></div>

          <div className="visual-footer">
            <span>BOOK SMARTER. LIVE BETTER.</span>
            <span>© MediSlot 2026</span>
          </div>
        </section>

        {/* Right Section */}
        <section className="login-form-section">
          <div className="login-form-container">

            <div className="login-mobile-brand">
              <span className="login-brand-icon">✚</span>
              MediSlot
            </div>

            <div className="login-heading">
              <span className="login-eyebrow">
                WELCOME BACK
              </span>

              <h2>Sign in to MediSlot</h2>

              <p>
                Welcome back! Please enter your details to access your account.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="bookit-login-form"
            >

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />

              <div className="password-label-row">
                <label htmlFor="password">
                  Password
                </label>
              </div>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                className="bookit-login-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && <span>→</span>}
              </button>

            </form>

            <p className="login-register-text">
              Don't have an account?{" "}
              <Link to="/register">
                Create an account
              </Link>
            </p>

            <div className="login-security">
              <span>🔒</span>
              Your account information is securely protected.
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
