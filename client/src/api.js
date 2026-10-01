// Small fetch wrapper for the HustleHub+ API.
// - prefixes /api (proxied to the Express server by Vite in development)
// - attaches the JWT from localStorage
// - turns failed responses into ApiError with the server's message

const TOKEN_KEY = "token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - nothing to clear */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Please try again.", 0);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok) {
    // The server marks bad/expired tokens with a code so we can sign the
    // user out without confusing it with a normal "wrong role" 403.
    if (data?.code === "TOKEN_INVALID") {
      window.dispatchEvent(new Event("auth:expired"));
    }

    throw new ApiError(
      data?.message || `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}
