import { Link } from "react-router-dom";

import { formatPrice } from "../utils/format";

import "../styles/Gigs.css";

// One gig in the marketplace. What the person can do depends on who they are.
function GigCard({ gig, user, onBook }) {
  const isOwner = Boolean(user) && gig.freelancer?._id === user.id;

  let action;

  if (!user) {
    action = (
      <Link to="/login" state={{ from: "/gigs" }} className="gig-btn">
        Log in to book
      </Link>
    );
  } else if (user.role === "client") {
    action = (
      <button type="button" className="gig-btn" onClick={() => onBook(gig)}>
        Book now
      </button>
    );
  } else if (isOwner) {
    action = <span className="gig-note">This is your gig</span>;
  } else {
    action = <span className="gig-note">Only clients can book</span>;
  }

  return (
    <article className="gig-card">
      <span className="badge">{gig.category}</span>

      <h3>{gig.title}</h3>

      <p className="gig-desc">{gig.description}</p>

      <p className="gig-by">by {gig.freelancer?.name || "Unknown freelancer"}</p>

      <div className="gig-footer">
        <strong className="gig-price">{formatPrice(gig.price)}</strong>

        {action}
      </div>
    </article>
  );
}

export default GigCard;
