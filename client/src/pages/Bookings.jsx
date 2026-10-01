import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { formatDate, formatPrice } from "../utils/format";

import "../styles/Gigs.css";

// Bookings for the logged-in person. Clients see what they booked;
// freelancers see who booked them, plus their income.
function Bookings() {
  const { user } = useAuth();
  const isFreelancer = user.role === "freelancer";

  const bookingsApi = useApi(isFreelancer ? "/bookings/freelancer" : "/bookings/client");
  const incomeApi = useApi("/bookings/income", { enabled: isFreelancer });

  const bookings = bookingsApi.data?.data ?? [];

  // Cancelled bookings don't count towards what a client has spent.
  const totalSpent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">{isFreelancer ? "FREELANCER" : "CLIENT"}</p>
          <h1>{isFreelancer ? "Bookings & income" : "My bookings"}</h1>
          <p className="page-sub">
            {isFreelancer
              ? "Everyone who has booked one of your gigs."
              : "The services you've booked."}
          </p>
        </div>
      </header>

      {bookingsApi.data && (
        <div className="summary-grid">
          <div className="summary-card">
            <strong>{bookings.length}</strong>
            <span>{bookings.length === 1 ? "Booking" : "Bookings"}</span>
          </div>

          <div className="summary-card">
            <strong>
              {isFreelancer
                ? incomeApi.data
                  ? formatPrice(incomeApi.data.totalIncome)
                  : "-"
                : formatPrice(totalSpent)}
            </strong>
            <span>{isFreelancer ? "Total income" : "Total spent"}</span>
          </div>
        </div>
      )}

      {isFreelancer && incomeApi.error && (
        <div className="notice error" role="alert">
          <span>{incomeApi.error}</span>
        </div>
      )}

      {bookingsApi.error && (
        <div className="notice error" role="alert">
          <span>{bookingsApi.error}</span>
          <button type="button" className="link-btn" onClick={bookingsApi.reload}>
            Try again
          </button>
        </div>
      )}

      {!bookingsApi.error && bookingsApi.loading && !bookingsApi.data && (
        <div className="state-box">Loading bookings…</div>
      )}

      {!bookingsApi.error && bookingsApi.data && bookings.length === 0 && (
        <div className="state-box">
          {isFreelancer ? (
            <p>No one has booked your gigs yet.</p>
          ) : (
            <>
              <p>You haven't booked anything yet.</p>
              <Link to="/gigs" className="hh-btn primary">
                Browse gigs
              </Link>
            </>
          )}
        </div>
      )}

      {!bookingsApi.error && bookings.length > 0 && (
        <ul className="row-list">
          {bookings.map((booking) => {
            const other = isFreelancer ? booking.client : booking.freelancer;

            return (
              <li key={booking._id} className="row-card">
                <div className="row-main">
                  <div className="row-title">
                    <h3>{booking.gig?.title || "Gig no longer available"}</h3>
                    <span className={`status-pill ${booking.status}`}>{booking.status}</span>
                  </div>

                  <p className="row-meta">
                    <span>
                      {isFreelancer ? "Client" : "Freelancer"}:{" "}
                      {other?.name || "Unknown"}
                      {other?.email ? ` (${other.email})` : ""}
                    </span>
                    <span>Booked {formatDate(booking.createdAt)}</span>
                  </p>
                </div>

                <div className="row-amount">{formatPrice(booking.amount)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Bookings;
