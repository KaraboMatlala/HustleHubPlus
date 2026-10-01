import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { passwordProblem } from "../utils/validation";

import "../styles/Auth.css";

function Register() {
  const { user, register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Signed in already, or just created the account (register logs you in).
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const problem = passwordProblem(formData.password);

    if (problem) {
      setError(problem);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
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

      <main className="auth-card register-card">
        {/* Top section */}
        <div className="auth-top">
          <div className="auth-logo">
            HustleHub<span>+</span>
          </div>

          <div className="auth-status">
            <span>●</span> Join the hub
          </div>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <p className="auth-eyebrow">CREATE YOUR ACCOUNT</p>

          <h1>
            Your hustle <span>starts here.</span>
          </h1>

          <p className="auth-intro">
            Create your account and start connecting, building and growing
            with HustleHub+.
          </p>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={80}
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Password hint (matches the server's rules) */}
          <p
            style={{
              fontSize: "11px",
              color: "#817687",
              marginTop: "-8px",
              marginBottom: "20px",
            }}
          >
            At least 8 characters, with an uppercase letter and a number.
          </p>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Account Type</label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="freelancer">Freelancer - I offer services</option>
              <option value="client">Client - I want to hire</option>
            </select>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <div className="auth-bottom">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
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

export default Register;
