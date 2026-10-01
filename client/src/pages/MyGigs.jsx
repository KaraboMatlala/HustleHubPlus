import { useState } from "react";

import { apiFetch } from "../api";
import { useApi } from "../hooks/useApi";
import { formatDate, formatPrice } from "../utils/format";

import GigFormModal from "../components/GigFormModal";
import Modal from "../components/Modal";

import "../styles/Gigs.css";

// FREELANCER: create, edit, hide/show and delete your own gigs.
function MyGigs() {
  const { data, error, loading, reload } = useApi("/gigs/mine");

  const [formGig, setFormGig] = useState(undefined); // undefined = closed, null = new, object = edit
  const [gigToDelete, setGigToDelete] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });

  const gigs = data?.data ?? [];

  function handleSaved(message) {
    setFormGig(undefined);
    setNotice({ type: "success", text: message });
    reload();
  }

  async function toggleStatus(gig) {
    const next = gig.status === "active" ? "inactive" : "active";

    setBusyId(gig._id);
    setNotice({ type: "", text: "" });

    try {
      await apiFetch(`/gigs/${gig._id}`, { method: "PUT", body: { status: next } });

      setNotice({
        type: "success",
        text: next === "active" ? "Gig is live again." : "Gig hidden from the marketplace.",
      });
      reload();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  async function confirmDelete() {
    setBusyId(gigToDelete._id);
    setDeleteError("");

    try {
      await apiFetch(`/gigs/${gigToDelete._id}`, { method: "DELETE" });

      setGigToDelete(null);
      setNotice({ type: "success", text: "Gig deleted." });
      reload();
    } catch (err) {
      // e.g. 409 - the gig already has bookings
      setDeleteError(err.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">FREELANCER</p>
          <h1>My gigs</h1>
          <p className="page-sub">Post the services you offer and keep them up to date.</p>
        </div>

        <button type="button" className="hh-btn primary" onClick={() => setFormGig(null)}>
          + Post a gig
        </button>
      </header>

      {notice.text && (
        <div className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          <span>{notice.text}</span>
        </div>
      )}

      {error && (
        <div className="notice error" role="alert">
          <span>{error}</span>
          <button type="button" className="link-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {!error && loading && !data && <div className="state-box">Loading your gigs…</div>}

      {!error && data && gigs.length === 0 && (
        <div className="state-box">
          <p>You haven't posted any gigs yet.</p>
          <button type="button" className="hh-btn primary" onClick={() => setFormGig(null)}>
            Post your first gig
          </button>
        </div>
      )}

      {!error && gigs.length > 0 && (
        <ul className="row-list">
          {gigs.map((gig) => (
            <li key={gig._id} className="row-card">
              <div className="row-main">
                <div className="row-title">
                  <h3>{gig.title}</h3>
                  <span className={`status-pill ${gig.status}`}>{gig.status}</span>
                </div>

                <p className="row-meta">
                  <span className="badge">{gig.category}</span>
                  <span>{formatPrice(gig.price)}</span>
                  <span>Posted {formatDate(gig.createdAt)}</span>
                </p>

                <p className="row-desc">{gig.description}</p>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="hh-btn ghost small"
                  onClick={() => setFormGig(gig)}
                  disabled={busyId === gig._id}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="hh-btn ghost small"
                  onClick={() => toggleStatus(gig)}
                  disabled={busyId === gig._id}
                >
                  {gig.status === "active" ? "Hide" : "Show"}
                </button>

                <button
                  type="button"
                  className="hh-btn danger small"
                  onClick={() => {
                    setDeleteError("");
                    setGigToDelete(gig);
                  }}
                  disabled={busyId === gig._id}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formGig !== undefined && (
        <GigFormModal
          gig={formGig}
          onClose={() => setFormGig(undefined)}
          onSaved={handleSaved}
        />
      )}

      {gigToDelete && (
        <Modal
          title="Delete gig?"
          onClose={() => (busyId ? undefined : setGigToDelete(null))}
        >
          <div className="modal-body">
            <p className="confirm-title">{gigToDelete.title}</p>
            <p className="confirm-hint">
              This permanently removes the gig. If you only want to pause
              bookings, use Hide instead.
            </p>

            {deleteError && (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="hh-btn ghost"
              onClick={() => setGigToDelete(null)}
              disabled={Boolean(busyId)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="hh-btn danger"
              onClick={confirmDelete}
              disabled={Boolean(busyId)}
            >
              {busyId ? "Deleting…" : "Delete gig"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default MyGigs;
