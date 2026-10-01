import { Link } from "react-router-dom";

import "../styles/Gigs.css";

function NotFound() {
  return (
    <div className="page">
      <div className="state-box">
        <h1>Page not found</h1>
        <p>That page doesn't exist.</p>
        <Link to="/" className="hh-btn primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
