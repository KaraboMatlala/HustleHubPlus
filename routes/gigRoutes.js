const express = require("express");

const router = express.Router();

const {
    createGig,
    getAllGigs,
    getMyGigs,
    updateGig,
    deleteGig
} = require("../controllers/gigController");

const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");


// Anyone can browse gigs
router.get("/", getAllGigs);


// A freelancer's own gigs (including hidden ones).
// Must be declared before "/:id" routes so "mine" isn't read as an id.
router.get(
    "/mine",
    authenticateToken,
    authorizeRole("freelancer"),
    getMyGigs
);


// Only freelancers can create gigs
router.post(
    "/",
    authenticateToken,
    authorizeRole("freelancer"),
    createGig
);


// Only freelancers can update their own gigs
router.put(
    "/:id",
    authenticateToken,
    authorizeRole("freelancer"),
    updateGig
);


// Only freelancers can delete their own gigs
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("freelancer"),
    deleteGig
);


module.exports = router;