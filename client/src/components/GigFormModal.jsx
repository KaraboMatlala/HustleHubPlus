import { useState } from "react";

import { apiFetch } from "../api";
import { CATEGORIES } from "../constants";

import Modal from "./Modal";

import "../styles/Gigs.css";

// Create (gig = null) or edit (gig = existing) a gig.
function GigFormModal({ gig, onClose, onSaved }) {
  const isEditing = Boolean(gig);

  const [form, setForm] = useState({
    title: gig?.title ?? "",
    category: gig?.category ?? CATEGORIES[0],
    price: gig ? String(gig.price) : "",
    description: gig?.description ?? "",
    status: gig?.status ?? "active",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // A gig created through the API could have a category we don't list.
  const categoryOptions = CATEGORIES.includes(form.category)
    ? CATEGORIES
    : [form.category, ...CATEGORIES];

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const price = Number(form.price);

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Enter a price of 0 or more.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      price,
      description: form.description.trim(),
    };

    setSaving(true);

    try {
      if (isEditing) {
        await apiFetch(`/gigs/${gig._id}`, {
          method: "PUT",
          body: { ...payload, status: form.status },
        });
      } else {
        await apiFetch("/gigs", { method: "POST", body: payload });
      }

      onSaved(isEditing ? "Gig updated." : "Gig posted - it's now live in the marketplace.");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit gig" : "Post a new gig"} onClose={saving ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="gig-title">Title</label>
          <input
            id="gig-title"
            name="title"
            type="text"
            maxLength={100}
            placeholder="e.g. I will design your logo"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gig-category">Category</label>
            <select
              id="gig-category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="gig-price">Price (R)</label>
            <input
              id="gig-price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="350"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="gig-description">Description</label>
          <textarea
            id="gig-description"
            name="description"
            rows={5}
            maxLength={1000}
            placeholder="What do clients get? How long does it take?"
            value={form.description}
            onChange={handleChange}
            required
          />
          <span className="char-count">{form.description.length}/1000</span>
        </div>

        {isEditing && (
          <div className="form-group">
            <label htmlFor="gig-status">Visibility</label>
            <select
              id="gig-status"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active - visible and bookable</option>
              <option value="inactive">Inactive - hidden from the marketplace</option>
            </select>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="hh-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <button type="submit" className="hh-btn primary" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Post gig"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default GigFormModal;
