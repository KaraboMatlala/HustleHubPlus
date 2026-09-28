import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import "./styles/index.css";

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to HustleHub+</h1>
        <p>
          Connect with talented freelancers, discover local services, and grow
          your hustle from one platform.
        </p>

        <div className="hero-buttons">
          <Link to="/register" className="btn primary">
            Get Started
          </Link>

          <Link to="/login" className="btn secondary">
            Login
          </Link>
        </div>
      </div>

      <section className="features">
        <div className="feature-card">
          <h3>💼 Hire Freelancers</h3>
          <p>Find skilled people for design, coding, tutoring, photography, and more.</p>
        </div>

        <div className="feature-card">
          <h3>🚀 Offer Your Services</h3>
          <p>Create a profile and start earning from your skills.</p>
        </div>

        <div className="feature-card">
          <h3>🌍 Grow Your Hustle</h3>
          <p>Build your network and connect with clients across South Africa.</p>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <h2>HustleHub+</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;