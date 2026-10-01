const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

// Tighter limit for credential endpoints to slow down password guessing.
// Successful requests don't count, so normal use is never blocked.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many attempts. Please try again later."
    }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

module.exports = router;
