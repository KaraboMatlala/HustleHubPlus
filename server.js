// Starts HustleHub+: checks configuration, connects to MongoDB, then listens.
// All the Express setup (routes, security middleware) lives in app.js.
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 4000;

function fail(message) {
    console.error(`\nCannot start HustleHub+: ${message}\n`);
    process.exit(1);
}

async function start() {
    // The old server started happily without these and then failed on the
    // first login with a confusing error.
    for (const name of ["MONGODB_URI", "JWT_SECRET"]) {
        if (!process.env[name]) {
            fail(`${name} is not set. Copy .env.example to .env and fill it in.`);
        }
    }

    if (process.env.JWT_SECRET.length < 32) {
        console.warn(
            "Warning: JWT_SECRET is short. Use a long random value (see .env.example)."
        );
    }

    try {
        await connectDB();
    } catch (error) {
        fail(`could not connect to MongoDB (${error.message}).`);
    }

    // HTTPS when the local certificate exists (see README), plain HTTP otherwise.
    const keyPath = path.join(__dirname, "cert", "key.pem");
    const certPath = path.join(__dirname, "cert", "cert.pem");
    const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

    const server = hasCert
        ? https.createServer(
              { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
              app
          )
        : http.createServer(app);

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            fail(`port ${PORT} is already in use. Stop the other process or change PORT in .env.`);
        }

        fail(error.message);
    });

    server.listen(PORT, () => {
        const scheme = hasCert ? "https" : "http";

        console.log(`HustleHub+ running on ${scheme}://localhost:${PORT}`);

        if (!hasCert) {
            console.warn("No cert/ folder found - serving plain HTTP (fine for local development).");
        }
    });
}

start();
