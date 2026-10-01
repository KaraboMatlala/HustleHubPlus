const Gig = require("../models/Gig");
const Booking = require("../models/Booking");

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 1000;
const MAX_CATEGORY = 50;
const MAX_PRICE = 1000000;

const isText = (value) => typeof value === "string";
const isValidId = (value) => isText(value) && /^[a-f\d]{24}$/i.test(value);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Each validator returns { value } when the input is fine, or { error }.
function textField(label, raw, max) {
    if (!isText(raw) || !raw.trim()) {
        return { error: `${label} is required.` };
    }

    const value = raw.trim();

    if (value.length > max) {
        return { error: `${label} must be ${max} characters or fewer.` };
    }

    return { value };
}

function priceField(raw) {
    // Accept numbers and numeric strings ("350.50"); reject everything else
    // (objects, booleans, arrays, "abc").
    const isNumeric =
        typeof raw === "number" || (isText(raw) && raw.trim() !== "");
    const price = isNumeric ? Number(raw) : NaN;

    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
        return { error: `Price must be a number between 0 and ${MAX_PRICE}.` };
    }

    return { value: Math.round(price * 100) / 100 };
}

// Runs the validators for whichever fields were supplied.
// `requireAll` is true on create, false on update.
function validateGigInput(body, requireAll) {
    const result = {};
    const fields = [
        ["title", "Title", (v) => textField("Title", v, MAX_TITLE)],
        ["description", "Description", (v) => textField("Description", v, MAX_DESCRIPTION)],
        ["category", "Category", (v) => textField("Category", v, MAX_CATEGORY)],
        ["price", "Price", priceField]
    ];

    for (const [key, label, check] of fields) {
        if (body[key] === undefined) {
            if (requireAll) {
                return { error: "Title, description, category and price are required." };
            }
            continue;
        }

        const outcome = check(body[key]);

        if (outcome.error) {
            return { error: outcome.error };
        }

        result[key] = outcome.value;
    }

    if (body.status !== undefined) {
        if (!["active", "inactive"].includes(body.status)) {
            return { error: "Status must be either active or inactive." };
        }

        result.status = body.status;
    }

    return { data: result };
}


// CREATE GIG
const createGig = async (req, res) => {
    try {
        const { error, data } = validateGigInput(req.body || {}, true);

        if (error) {
            return res.status(400).json({ message: error });
        }

        // Status is deliberately not taken from the body: new gigs go live.
        const gig = await Gig.create({
            title: data.title,
            description: data.description,
            category: data.category,
            price: data.price,
            freelancer: req.user.id
        });

        return res.status(201).json({
            message: "Gig created successfully.",
            gig
        });

    } catch (err) {
        console.error("Create gig error:", err);

        return res.status(500).json({
            message: "Failed to create gig."
        });
    }
};


// GET ALL GIGS (public marketplace)
// Only active gigs, and only the freelancer's name - never their email.
// Optional filters: ?search=logo  ?category=Design
const getAllGigs = async (req, res) => {
    try {
        const filter = { status: "active" };

        // Only plain strings are used, so ?search[$ne]=x can't inject operators.
        const search = isText(req.query.search) ? req.query.search.trim().slice(0, 100) : "";
        const category = isText(req.query.category) ? req.query.category.trim().slice(0, MAX_CATEGORY) : "";

        if (search) {
            const pattern = new RegExp(escapeRegex(search), "i");

            filter.$or = [
                { title: pattern },
                { description: pattern },
                { category: pattern }
            ];
        }

        if (category) {
            filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
        }

        const gigs = await Gig.find(filter)
            .sort({ createdAt: -1 })
            .populate("freelancer", "name");

        return res.status(200).json({
            count: gigs.length,
            data: gigs
        });

    } catch (err) {
        console.error("Get gigs error:", err);

        return res.status(500).json({
            message: "Failed to retrieve gigs."
        });
    }
};


// GET MY GIGS (freelancer) - includes inactive ones
const getMyGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ freelancer: req.user.id })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: gigs.length,
            data: gigs
        });

    } catch (err) {
        console.error("Get my gigs error:", err);

        return res.status(500).json({
            message: "Failed to retrieve your gigs."
        });
    }
};


// UPDATE OWN GIG
const updateGig = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: "Invalid gig ID." });
        }

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({ message: "Gig not found." });
        }

        // Ownership check
        if (gig.freelancer.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access denied. You can only update your own gigs."
            });
        }

        const { error, data } = validateGigInput(req.body || {}, false);

        if (error) {
            return res.status(400).json({ message: error });
        }

        // Update only supplied fields
        Object.assign(gig, data);

        await gig.save();

        return res.status(200).json({
            message: "Gig updated successfully.",
            gig
        });

    } catch (err) {
        console.error("Update gig error:", err);

        return res.status(500).json({
            message: "Failed to update gig."
        });
    }
};


// DELETE OWN GIG
const deleteGig = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: "Invalid gig ID." });
        }

        const gig = await Gig.findById(id);

        if (!gig) {
            return res.status(404).json({ message: "Gig not found." });
        }

        // Ownership check
        if (gig.freelancer.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access denied. You can only delete your own gigs."
            });
        }

        // Deleting a booked gig would leave bookings pointing at nothing.
        if (await Booking.exists({ gig: gig._id })) {
            return res.status(409).json({
                message: "This gig already has bookings, so it can't be deleted. Hide it instead by setting it to inactive."
            });
        }

        await Gig.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Gig deleted successfully."
        });

    } catch (err) {
        console.error("Delete gig error:", err);

        return res.status(500).json({
            message: "Failed to delete gig."
        });
    }
};


module.exports = {
    createGig,
    getAllGigs,
    getMyGigs,
    updateGig,
    deleteGig
};
