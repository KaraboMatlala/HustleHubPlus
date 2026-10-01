import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";

// Wrap a page to require login, and optionally a specific role:
//   <ProtectedRoute roles={["freelancer"]}><MyGigs /></ProtectedRoute>
function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <div className="state-box">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
