import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "./AuthContext";
import { apiFetch, clearToken, getToken, setToken } from "../api";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // If a token is stored we have to ask the server who it belongs to before
  // we know whether the visitor is logged in.
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  // Restore the session on first load.
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;

    apiFetch("/profile")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((error) => {
        // A rejected token is dropped; a network error leaves it for next time.
        if (error.status === 401 || error.status === 403) clearToken();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // api.js announces when the server says the token is no longer valid.
  useEffect(() => {
    function handleExpired() {
      clearToken();
      setUser(null);
    }

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { name, email, password, role },
    });

    // The API doesn't return a token on sign-up, so log straight in.
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
