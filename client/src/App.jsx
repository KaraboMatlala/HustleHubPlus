import { BrowserRouter, Route, Routes } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Gigs from "./pages/Gigs";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyGigs from "./pages/MyGigs";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-gigs"
            element={
              <ProtectedRoute roles={["freelancer"]}>
                <MyGigs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={["client", "freelancer"]}>
                <Bookings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
