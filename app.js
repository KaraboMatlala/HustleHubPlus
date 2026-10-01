// Builds the Express app. Kept separate from server.js (which connects to
// MongoDB and starts HTTPS) so the app can be tested without either.
require("dotenv").config();

const fs = require("fs");
const path = require("path");

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const authenticateToken = require("./middleware/authenticateToken");

const authRoutes = require("./routes/authRoutes");
const gigRoutes = require("./routes/gigRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const { getProfile } = require("./controllers/authController");

const app = express();


// ---------- SECURITY MIDDLEWARE ----------

// HSTS and "upgrade-insecure-requests" are production-only. Browsers pin HSTS
// to the hostname and ignore the port, so sending it from https://localhost
// can make http://localhost:5173 (the Vite dev server) stop loading.
const isProduction = process.env.NODE_ENV === "production";

app.use(
    helmet({
        strictTransportSecurity: isProduction,
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "upgrade-insecure-requests": isProduction ? [] : null
            }
        }
    })
);

app.use(express.json({ limit: "10kb" }));

// express-mongo-sanitize's middleware crashes on Express 5 (it tries to
// overwrite req.query, which is now read-only), which made EVERY request
// return a 500. Calling its sanitize() on the body directly does the same
// job. Express 5 already parses query strings with the "simple" parser, so
// query objects like ?email[$gt]= can't be created in the first place.
app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
        mongoSanitize.sanitize(req.body);
    }

    next();
});

// Applies to the API only. It used to cover static files too, so loading the
// React app (many asset requests) would burn through the allowance quickly.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);


// ---------- API ROUTES ----------

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/profile", authenticateToken, getProfile);

// Unknown API paths get JSON, not the HTML page.
app.use("/api", (req, res) => {
    res.status(404).json({ message: "Route not found." });
});


// ---------- FRONTEND ----------
// If the React app has been built (npm run build in /client) it is served
// from here, with client-side routes falling back to index.html. Otherwise
// the original static pages in /public are served.

const distDir = path.join(__dirname, "client", "dist");
const publicDir = path.join(__dirname, "public");
const hasReactBuild = fs.existsSync(path.join(distDir, "index.html"));

app.use(express.static(hasReactBuild ? distDir : publicDir));

if (hasReactBuild) {
    app.get("/{*splat}", (req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
    });
}


// ---------- ERROR HANDLING ----------

app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body." });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body too large." });
    }

    console.error(err);

    res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;
