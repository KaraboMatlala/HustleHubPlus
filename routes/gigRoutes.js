const express = require("express");

const router = express.Router();

const {
    createGig,
    getAllGigs,
    updateGig,
    deleteGig
} = require("../controllers/gigController");

const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");


// Anyone can browse gigs
router.get("/", getAllGigs);


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