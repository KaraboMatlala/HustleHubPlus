const Gig = require("../models/Gig");

// CREATE GIG
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


// GET ALL GIGS
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


// UPDATE OWN GIG
const updateGig = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, price, status } = req.body;

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found."
            });
        }

        // Ownership check
        if (gig.freelancer.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access denied. You can only update your own gigs."
            });
        }

        // Update only supplied fields
        if (title !== undefined) gig.title = title;
        if (description !== undefined) gig.description = description;
        if (category !== undefined) gig.category = category;
        if (price !== undefined) gig.price = price;
        if (status !== undefined) gig.status = status;

        await gig.save();

        res.status(200).json({
            message: "Gig updated successfully.",
            gig
        });

    } catch (error) {
        console.error("Update gig error:", error);

        res.status(500).json({
            message: "Failed to update gig."
        });
    }
};


// DELETE OWN GIG
const deleteGig = async (req, res) => {
    try {
        const { id } = req.params;

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found."
            });
        }

        // Ownership check
        if (gig.freelancer.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access denied. You can only delete your own gigs."
            });
        }

        await Gig.findByIdAndDelete(id);

        res.status(200).json({
            message: "Gig deleted successfully."
        });

    } catch (error) {
        console.error("Delete gig error:", error);

        res.status(500).json({
            message: "Failed to delete gig."
        });
    }
};


module.exports = {
    createGig,
    getAllGigs,
    updateGig,
    deleteGig
};