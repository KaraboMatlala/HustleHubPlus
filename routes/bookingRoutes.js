const express = require("express");

const router = express.Router();

const {
    createBooking,
    getClientBookings,
    getFreelancerBookings,
    getFreelancerIncome
} = require("../controllers/bookingController");

const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");


// CLIENT: Create a booking
router.post(
    "/",
    authenticateToken,
    authorizeRole("client"),
    createBooking
);


// CLIENT: View their bookings
router.get(
    "/client",
    authenticateToken,
    authorizeRole("client"),
    getClientBookings
);


// FREELANCER: View bookings for their gigs
router.get(
    "/freelancer",
    authenticateToken,
    authorizeRole("freelancer"),
    getFreelancerBookings
);


// FREELANCER: View income
router.get(
    "/income",
    authenticateToken,
    authorizeRole("freelancer"),
    getFreelancerIncome
);


module.exports = router;