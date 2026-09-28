const express = require("express");

const router = express.Router();

const {
    createGig,
    getAllGigs
} = require("../controllers/gigController");

const authenticateToken = require("../middleware/authenticateToken");

router.get("/", getAllGigs);

router.post("/", authenticateToken, createGig);

module.exports = router;