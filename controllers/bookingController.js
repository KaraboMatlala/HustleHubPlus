const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const Transaction = require("../models/Transaction");

const isValidId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);


// CREATE BOOKING
const createBooking = async (req, res) => {
    try {
        const { gigId } = req.body || {};

        if (!gigId) {
            return res.status(400).json({
                message: "Gig ID is required."
            });
        }

        // A malformed id used to throw a CastError and come back as a 500.
        if (!isValidId(gigId)) {
            return res.status(400).json({
                message: "Invalid gig ID."
            });
        }

        const gig = await Gig.findById(gigId);

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found."
            });
        }

        if (gig.status !== "active") {
            return res.status(400).json({
                message: "This gig is not available for booking."
            });
        }

        // A freelancer cannot book their own gig
        if (gig.freelancer.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot book your own gig."
            });
        }

        const booking = await Booking.create({
            gig: gig._id,
            client: req.user.id,
            freelancer: gig.freelancer,
            amount: gig.price,
            status: "confirmed"
        });

        let transaction;

        try {
            transaction = await Transaction.create({
                booking: booking._id,
                client: req.user.id,
                freelancer: gig.freelancer,
                amount: gig.price,
                status: "successful"
            });
        } catch (transactionError) {
            // Don't leave a confirmed booking behind with no payment record.
            await Booking.findByIdAndDelete(booking._id);
            throw transactionError;
        }

        return res.status(201).json({
            message: "Booking created successfully.",
            booking,
            transaction
        });

    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Failed to create booking."
        });
    }
};


// CLIENT: VIEW THEIR BOOKINGS
const getClientBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            client: req.user.id
        })
            .sort({ createdAt: -1 })
            .populate("gig")
            .populate("freelancer", "name email");

        return res.status(200).json({
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error("Get client bookings error:", error);

        return res.status(500).json({
            message: "Failed to retrieve bookings."
        });
    }
};


// FREELANCER: VIEW THEIR BOOKINGS
const getFreelancerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            freelancer: req.user.id
        })
            .sort({ createdAt: -1 })
            .populate("gig")
            .populate("client", "name email");

        return res.status(200).json({
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error("Get freelancer bookings error:", error);

        return res.status(500).json({
            message: "Failed to retrieve bookings."
        });
    }
};


// FREELANCER: VIEW THEIR INCOME
const getFreelancerIncome = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            freelancer: req.user.id,
            status: "successful"
        });

        const totalIncome = transactions.reduce(
            (total, transaction) => total + transaction.amount,
            0
        );

        return res.status(200).json({
            totalIncome,
            transactionCount: transactions.length,
            transactions
        });

    } catch (error) {
        console.error("Get freelancer income error:", error);

        return res.status(500).json({
            message: "Failed to retrieve income."
        });
    }
};


module.exports = {
    createBooking,
    getClientBookings,
    getFreelancerBookings,
    getFreelancerIncome
};
