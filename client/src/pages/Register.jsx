import { useState } from "react";
import "../styles/Auth.css";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password should contain at least 8 characters.");
      return;
    }

    console.log("New User:", formData);

    alert("Registration successful!");

    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "freelancer",
    });
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
                value={formData.password}
                onChange={handleChange}
                minLength="8"
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
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength="8"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Password hint */}
          <p
            style={{
              fontSize: "11px",
              color: "#817687",
              marginTop: "-8px",
              marginBottom: "20px",
            }}
          >
            Password should contain at least 8 characters.
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
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Submit */}
          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        {/* Login link */}
        <div className="auth-bottom">
          <p>
            Already have an account?{" "}
            <a href="/login">Log in</a>
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