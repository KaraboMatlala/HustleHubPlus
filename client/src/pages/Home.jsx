import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to HustleHub+</h1>

        <p>
          Connect with talented freelancers, discover local services, and grow
          your hustle from one platform.
        </p>

        <div className="hero-buttons">
          {user ? (
            <Link to="/dashboard" className="btn primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn primary">
              Get Started
            </Link>
          )}

          <Link to="/gigs" className="btn secondary">
            Browse Gigs
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
          <p>Post a gig and start earning from your skills.</p>
        </div>

        <div className="feature-card">
          <h3>🌍 Grow Your Hustle</h3>
          <p>Build your network and connect with clients across South Africa.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
