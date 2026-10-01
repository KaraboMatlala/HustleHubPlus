# What was fixed and added

## Why the app was broken

The project was a mix of two states. Earlier fixes (`app.js`, the auth
controller, the React gig pages, the tests) existed as new files, but a later
`git` operation had put the already-tracked files back to the last commit. So
`server.js` was still the old single-file server that never loaded `app.js`, the
gig/booking routes and controllers were the old versions, and `App.jsx` /
`main.jsx` never used the new pages. The pieces existed but nothing connected
them. Everything below is now actually applied.

## Bugs fixed

### Back end
1. **Wrong server entry point.** `server.js` duplicated register/login inline and
   skipped `app.js`, so the new validation, role handling, rate limits and error
   handlers never ran. It is now a thin starter around `app.js`.
2. **Server ran with no database.** `connectDB` swallowed errors. The server now
   waits for MongoDB and exits with a clear message if it can't connect; it also
   checks `MONGODB_URI` / `JWT_SECRET` are set.
3. **`/api/gigs/mine` didn't exist**, so the freelancer's "My Gigs" page could
   never load. Added (and declared before `/:id`).
4. **Public gig list leaked freelancer emails** and included hidden gigs. It now
   returns active gigs only, with the freelancer's name only.
5. **Gig input wasn't validated.** Bad prices, objects instead of strings, empty
   titles, bad statuses and malformed ids caused 500s or stored junk. All gig and
   booking inputs are validated and return 400/404 with a readable message.
6. **Deleting a booked gig orphaned its bookings.** Now `409` with a hint to hide
   the gig instead.
7. **A booking could be left without a payment record** if the transaction failed
   to save. The booking is now rolled back.
8. **Invalid/expired tokens had no machine-readable marker**, so the React app
   couldn't tell "session expired" from "wrong role". Responses now carry
   `"code": "TOKEN_INVALID"`.
9. **Helmet's HSTS** is production-only: browsers pin HSTS to `localhost` (ignoring
   the port), which can stop `http://localhost:5173` loading in development.
10. `package.json` had no `start` / `dev` / `test` scripts and a `main` file that
    didn't exist.

### React front end
11. **Login and Register never called the API.** They showed `alert("Login
    successful!")` and logged the password to the console. They now use the auth
    context, show errors inline, validate passwords with the server's rules, and
    redirect (back to where you were headed, if any).
12. **The new pages were unreachable.** `App.jsx` now has the full route table:
    `/gigs`, `/my-gigs` (freelancers), `/bookings`, protected `/dashboard`, and a
    404 page, wrapped in `AuthProvider`.
13. **Dashboard showed hard-coded fake data** ("Active Jobs: 12", "R4,800"). It now
    shows real numbers and role-specific actions.
14. **`--danger` / `--success` colours were undefined**, so error notices, success
    notices and the delete button were unstyled. Brand tokens and the navbar
    styles were restored in `index.css`.
15. **Vite template `App.css` clashed** with the home page's `.hero` styles; removed.
16. **No dev proxy.** `vite.config.js` now proxies `/api` to the Express server
    (self-signed certificate allowed).
17. Auth links used `<a href>` (full page reloads); now router `<Link>`s.
18. Page title was "client".

### Legacy `public/` pages (only used when `client/dist` doesn't exist)
19. Stray markdown code fences pasted into `script.js` and `dashboard.html`
    crashed the script and showed on the page.
20. Show/Hide password did nothing - the Content-Security-Policy blocks inline
    `onclick` and inline `<script>`. Moved into `script.js`.
21. XSS: the user's name was written with `innerHTML`; now `textContent`.

## Added

- **Gig front end (React):** marketplace with search + category filter and a
  booking confirmation dialog (`/gigs`); freelancer gig manager with create / edit
  / hide / delete (`/my-gigs`); bookings and income (`/bookings`).
- `GET /api/gigs/mine`, and `?search=` / `?category=` on `GET /api/gigs`.
- Database indexes for the marketplace and "my bookings" queries; length limits
  on gig fields in the schema.
- 12 API tests (`npm test`), a rewritten README, `.env.example`.

## Needs your attention

- **Rotate your MongoDB Atlas password and set a longer `JWT_SECRET`.** The `.env`
  (with a live Atlas URI and a 32-character secret) was inside the zip you shared.
  It was never committed to git, but treat it as exposed.
- **Your Atlas URI has no database name**, so data goes to MongoDB's default
  `test` database. Add `/hustlehubplus` to the end of the URI if you want a named
  one. Existing accounts live in `test`, so they won't appear in the new database.
- Expired-token responses still use status 403 (unchanged), plus the new `code`.
- Not verified here: a real `vite build` and a browser run (see the summary).
