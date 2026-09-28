const Gig = require("../models/Gig");

const createGig = async (req, res) => {
    try {
        const { title, description, category, price } = req.body;

        if (!title || !description || !category || price === undefined) {
            return res.status(400).json({
                message: "Title, description, category and price are required."
            });
        }

        const gig = await Gig.create({
            title,
            description,
            category,
            price,
            freelancer: req.user.id
        });

        res.status(201).json({
            message: "Gig created successfully.",
            gig
        });

    } catch (error) {
        console.error("Create gig error:", error);

        res.status(500).json({
            message: "Failed to create gig."
        });
    }
};

const getAllGigs = async (req, res) => {
    try {
        const gigs = await Gig.find()
            .populate("freelancer", "name email");

        res.status(200).json({
            count: gigs.length,
            data: gigs
        });

    } catch (error) {
        console.error("Get gigs error:", error);

        res.status(500).json({
            message: "Failed to retrieve gigs."
        });
    }
};

module.exports = {
    createGig,
    getAllGigs
};
