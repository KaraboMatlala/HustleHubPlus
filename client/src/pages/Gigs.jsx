import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../api";
import { CATEGORIES } from "../constants";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { formatPrice } from "../utils/format";

import GigCard from "../components/GigCard";
import Modal from "../components/Modal";

import "../styles/Gigs.css";

// PUBLIC MARKETPLACE: anyone can browse; clients can book.
function Gigs() {
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [selectedGig, setSelectedGig] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [notice, setNotice] = useState("");

  // Wait for a pause in typing before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const query = params.toString();

  const { data, error, loading, reload } = useApi(
    query ? `/gigs?${query}` : "/gigs"
  );

  const gigs = data?.data ?? [];
  const filtered = Boolean(search || category);

  function openBooking(gig) {
    setNotice("");
    setBookingError("");
    setSelectedGig(gig);
  }

  function closeBooking() {
    if (!booking) setSelectedGig(null);
  }

  async function confirmBooking() {
    setBooking(true);
    setBookingError("");

    try {
      await apiFetch("/bookings", {
        method: "POST",
        body: { gigId: selectedGig._id },
      });

      setNotice(`You booked "${selectedGig.title}".`);
      setSelectedGig(null);
    } catch (err) {
      setBookingError(err.message);

      // The gig may have just been deactivated - refresh the list.
      if (err.status === 400 || err.status === 404) reload();
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">MARKETPLACE</p>
          <h1>Browse gigs</h1>
          <p className="page-sub">
            Find a freelancer for your next job - design, development, tutoring and more.
          </p>
        </div>
      </header>

      {notice && (
        <div className="notice success" role="status">
          <span>{notice}</span>
          <Link to="/bookings">View my bookings</Link>
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search gigs…"
          aria-label="Search gigs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select
          className="filter-select"
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="notice error" role="alert">
          <span>{error}</span>
          <button type="button" className="link-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {!error && loading && !data && <div className="state-box">Loading gigs…</div>}

      {!error && data && gigs.length === 0 && (
        <div className="state-box">
          {filtered
            ? "No gigs match your search. Try different words or another category."
            : "No gigs have been posted yet. Check back soon!"}
        </div>
      )}

      {!error && gigs.length > 0 && (
        <div className={`gig-grid${loading ? " is-refreshing" : ""}`}>
          {gigs.map((gig) => (
            <GigCard key={gig._id} gig={gig} user={user} onBook={openBooking} />
          ))}
        </div>
      )}

      {selectedGig && (
        <Modal title="Confirm booking" onClose={closeBooking}>
          <div className="modal-body">
            <p className="confirm-title">{selectedGig.title}</p>

            <p className="confirm-meta">
              by {selectedGig.freelancer?.name || "Unknown freelancer"} ·{" "}
              {selectedGig.category}
            </p>

            <div className="confirm-total">
              <span>Total</span>
              <strong>{formatPrice(selectedGig.price)}</strong>
            </div>

            <p className="confirm-hint">
              Payments are simulated in this version - confirming creates the
              booking and records a successful transaction.
            </p>

            {bookingError && (
              <p className="form-error" role="alert">
                {bookingError}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="hh-btn ghost"
              onClick={closeBooking}
              disabled={booking}
            >
              Cancel
            </button>

            <button
              type="button"
              className="hh-btn primary"
              onClick={confirmBooking}
              disabled={booking}
            >
              {booking ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Gigs;
