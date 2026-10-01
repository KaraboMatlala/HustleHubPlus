import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        HustleHub<span>+</span>
      </Link>

      <div className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>

        <NavLink to="/gigs">Browse Gigs</NavLink>

        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>

            {user.role === "freelancer" && (
              <NavLink to="/my-gigs">My Gigs</NavLink>
            )}

            {(user.role === "freelancer" || user.role === "client") && (
              <NavLink to="/bookings">Bookings</NavLink>
            )}

            <span className="nav-user" title={user.email}>
              {user.name}
            </span>

            <button type="button" className="nav-logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>

            <NavLink to="/register" className="nav-cta">
              Sign up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
