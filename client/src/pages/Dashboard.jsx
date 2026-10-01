import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { formatPrice } from "../utils/format";

import "../styles/Dashboard.css";
import "../styles/Gigs.css";

// Shown while a number is still loading.
const DASH = "–";

function Dashboard() {
  const { user } = useAuth();

  const isFreelancer = user.role === "freelancer";
  const isClient = user.role === "client";

  // Only ask for what this role is allowed to see (the API 403s otherwise).
  const myGigs = useApi("/gigs/mine", { enabled: isFreelancer });
  const income = useApi("/bookings/income", { enabled: isFreelancer });
  const bookings = useApi(
    isFreelancer ? "/bookings/freelancer" : "/bookings/client",
    { enabled: isFreelancer || isClient }
  );
  const marketplace = useApi("/gigs");

  const firstName = user.name.split(" ")[0];

  const gigList = myGigs.data?.data ?? [];
  const bookingList = bookings.data?.data ?? [];
  const marketList = marketplace.data?.data ?? [];

  const activeGigs = gigList.filter((g) => g.status === "active").length;
  const hiddenGigs = gigList.length - activeGigs;
  const confirmed = bookingList.filter((b) => b.status === "confirmed").length;
  const totalSpent = bookingList
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.amount, 0);

  const stats = isFreelancer
    ? [
        { label: "Active gigs", value: myGigs.data ? activeGigs : DASH },
        { label: "Hidden gigs", value: myGigs.data ? hiddenGigs : DASH },
        { label: "Bookings received", value: bookings.data ? bookingList.length : DASH },
        {
          label: "Total income",
          value: income.data ? formatPrice(income.data.totalIncome) : DASH,
        },
      ]
    : [
        { label: "Bookings", value: bookings.data ? bookingList.length : DASH },
        { label: "Confirmed", value: bookings.data ? confirmed : DASH },
        { label: "Total spent", value: bookings.data ? formatPrice(totalSpent) : DASH },
        { label: "Gigs available", value: marketplace.data ? marketList.length : DASH },
      ];

  const errors = [myGigs.error, income.error, bookings.error, marketplace.error].filter(Boolean);

  const actions = isFreelancer
    ? [
        { to: "/my-gigs", title: "📦 My Gigs", text: "Post, edit, hide or remove the services you offer." },
        { to: "/bookings", title: "💳 Bookings & Income", text: "See who booked you and track your earnings." },
        { to: "/gigs", title: "🔎 Marketplace", text: "See how your gigs look next to everyone else's." },
      ]
    : [
        { to: "/gigs", title: "🔎 Browse Gigs", text: "Find a freelancer for your next job." },
        { to: "/bookings", title: "📋 My Bookings", text: "Review the services you've booked." },
      ];

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <section className="welcome-card">
        <h1>Welcome back, {firstName} 👋</h1>

        <p>
          {isFreelancer
            ? "Manage your gigs, keep an eye on bookings and watch your income grow."
            : "Discover freelancers and keep track of everything you've booked."}
        </p>

        {isFreelancer ? (
          <Link to="/my-gigs" className="post-btn">
            + Post a gig
          </Link>
        ) : (
          <Link to="/gigs" className="post-btn">
            Browse gigs
          </Link>
        )}
      </section>

      {errors.length > 0 && (
        <div className="notice error" role="alert">
          <span>{errors[0]}</span>
        </div>
      )}

      {/* Stats */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <h2>{stat.value}</h2>
            <p>{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Latest gigs */}
      <section className="services-section">
        <div className="section-header">
          <h2>Latest gigs</h2>
        </div>

        {marketplace.data && marketList.length === 0 && (
          <div className="state-box">No gigs have been posted yet.</div>
        )}

        <div className="service-grid">
          {marketList.slice(0, 4).map((gig) => (
            <div key={gig._id} className="service-card">
              <span className="badge">{gig.category}</span>

              <h3>{gig.title}</h3>

              <p className="location">by {gig.freelancer?.name || "Unknown freelancer"}</p>

              <h4>{formatPrice(gig.price)}</h4>

              <Link to="/gigs" className="service-link">
                View in marketplace
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2>Quick Actions</h2>

        <div className="actions-grid">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="action-card">
              <h3>{action.title}</h3>
              <p>{action.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
