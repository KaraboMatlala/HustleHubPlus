# HustleHub+

HustleHub+ connects people who offer skills and services (**freelancers**) with
people who need them (**clients**). Freelancers post **gigs**, clients browse the
marketplace and **book** them, and freelancers see their bookings and income.

- **Back end:** Node.js, Express 5, MongoDB (Mongoose), JWT auth, bcrypt, helmet,
  rate limiting, input validation / NoSQL-injection sanitising
- **Front end:** React 19 + React Router, built with Vite (`client/`)
- **Local HTTPS** with a self-signed certificate (optional)

## What you can do

| Role | Can do |
| --- | --- |
| Anyone | Browse and search the gig marketplace |
| Client | Book a gig, see their bookings and total spent |
| Freelancer | Post / edit / hide / delete their own gigs, see who booked them, see income |

Payments are **simulated**: booking a gig records a booking and a successful
transaction, but no money moves.

## Project structure

```text
HustleHubPlus/
├── app.js                 Express app: security middleware, routes, static files
├── server.js              Checks config, connects to MongoDB, starts HTTP(S)
├── config/db.js           MongoDB connection
├── controllers/           auth, gig and booking logic
├── routes/                auth, gig and booking routes
├── middleware/            authenticateToken (JWT), authorizeRole
├── models/                User, Gig, Booking, Transaction
├── test/                  API tests (no database needed)
├── client/                React front end (Vite)
│   └── src/
│       ├── pages/         Home, Login, Register, Dashboard, Gigs, MyGigs, Bookings
│       ├── components/    Navbar, ProtectedRoute, GigCard, GigFormModal, Modal
│       ├── context/       AuthProvider / useAuth
│       └── api.js         fetch wrapper (adds the JWT, handles errors)
└── public/                Old static pages - only served if client/dist doesn't exist
```

## Setup

You need Node.js 20+, npm, and a MongoDB database (e.g. a free MongoDB Atlas cluster).

```bash
git clone https://github.com/KaraboMatlala/HustleHubPlus.git
cd HustleHubPlus
npm install
npm run client:install
```

### Configure `.env`

Copy `.env.example` to `.env` and fill it in:

```text
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hustlehubplus
JWT_SECRET=<a long random string>
PORT=4000
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Put a database name (`/hustlehubplus` above) at the end of the URI. Without
> one, MongoDB uses its default database called `test`.
>
> `.env` is git-ignored. Never commit it or share it.

### Optional: local HTTPS certificate

If `cert/key.pem` and `cert/cert.pem` exist the server uses HTTPS, otherwise it
falls back to plain HTTP. To create a certificate:

```bash
mkdir cert
openssl req -x509 -newkey rsa:2048 -keyout cert/key.pem -out cert/cert.pem -days 365 -nodes
```

Use `localhost` as the Common Name. `cert/` is git-ignored.

## Running

### Development (hot reload)

Two terminals:

```bash
npm run dev            # API on https://localhost:4000 (http:// if no cert)
npm run client:dev     # React app on http://localhost:5173
```

Open **http://localhost:5173**. Vite proxies `/api` to the Express server, so
there is nothing to configure. If your API is on plain HTTP or another port:

```bash
API_URL=http://localhost:4000 npm run client:dev
```

### Production-style (one server)

```bash
npm run client:build   # builds client/ into client/dist
npm start              # Express serves the API and the built React app
```

Open **https://localhost:4000** (accept the browser warning for the self-signed
certificate). Set `NODE_ENV=production` in real deployments to enable HSTS.

## API

All bodies are JSON. Protected routes need `Authorization: Bearer <token>`.

| Method | Route | Who | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | anyone | `name`, `email`, `password` (8-72 chars, an uppercase letter and a number), optional `role`: `client` (default) or `freelancer` |
| POST | `/api/auth/login` | anyone | returns `{ token, user }` (token lasts 1 hour) |
| GET | `/api/profile` | logged in | the current user |
| GET | `/api/gigs` | anyone | active gigs only. Optional `?search=` and `?category=`. Freelancer's name only, never email |
| GET | `/api/gigs/mine` | freelancer | your gigs, including inactive ones |
| POST | `/api/gigs` | freelancer | `title` (max 100), `description` (max 1000), `category`, `price` (0 - 1,000,000) |
| PUT | `/api/gigs/:id` | owner | any of the fields above, plus `status`: `active` / `inactive` |
| DELETE | `/api/gigs/:id` | owner | `409` if the gig already has bookings - hide it instead |
| POST | `/api/bookings` | client | `{ "gigId": "..." }`, active gigs only; records a transaction |
| GET | `/api/bookings/client` | client | your bookings |
| GET | `/api/bookings/freelancer` | freelancer | bookings of your gigs |
| GET | `/api/bookings/income` | freelancer | `totalIncome`, `transactionCount`, `transactions` |

Errors look like `{ "message": "..." }`. An invalid or expired token returns `403`
with `"code": "TOKEN_INVALID"`; the React app uses that to log the user out.

## Tests

```bash
npm test
```

Runs the API tests against the real Mongoose models with an in-memory store, so
no MongoDB server is needed.

## Troubleshooting

**`Cannot start HustleHub+: MONGODB_URI is not set`** - create `.env` (see above).

**`could not connect to MongoDB`** - check the URI/password, and that your IP is
allowed in Atlas under *Network Access*.

**`port 4000 is already in use`** - stop the other process, or change `PORT`.
On Windows: `netstat -ano | findstr :4000`, then `taskkill /PID <PID> /F`.

**Browser certificate warning** - expected with a self-signed certificate in
local development. Proceed past it.

**The React app shows "Can't reach the server"** - the API isn't running, or
`API_URL` points at the wrong place.

## Authors

Mahlatsi Ramano, Karabo Matlala, Tyrich Reddy

Repository: https://github.com/KaraboMatlala/HustleHubPlus

## License

Intended for educational and development purposes.
