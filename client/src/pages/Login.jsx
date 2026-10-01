import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";

import "../styles/Auth.css";

function Login() {
  const { user, login } = useAuth();
  const location = useLocation();

  // ProtectedRoute and the "Log in to book" button pass where the person was
  // headed, so we can send them back there afterwards.
  const destination =
    typeof location.state?.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : "/dashboard";

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already signed in (or just finished signing in): leave this page.
  if (user) {
    return <Navigate to={destination} replace />;
  }

  function handleChange(e) {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      // On success the context updates and the <Navigate> above takes over.
      await login(loginData.email.trim(), loginData.password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Decorative background */}
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <div className="plus-pattern plus-one">+</div>
      <div className="plus-pattern plus-two">+</div>
      <div className="plus-pattern plus-three">+</div>

      <main className="auth-card login-card">
        {/* Header */}
        <div className="auth-top">
          <div className="auth-logo">
            HustleHub<span>+</span>
          </div>

          <div className="auth-status">
            <span>●</span> Welcome back
          </div>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <p className="auth-eyebrow">WELCOME BACK</p>

          <h1>
            Back to your <span>hustle.</span>
          </h1>

          <p className="auth-intro">
            Log in to your HustleHub+ account and continue connecting,
            working and growing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={loginData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? "Logging in…" : "Log In"}
          </button>
        </form>

        {/* Bottom link */}
        <div className="auth-bottom">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <strong>HustleHub+</strong>
          <span>Build. Connect. Grow.</span>
        </div>
      </main>
    </div>
  );
}

export default Login;
