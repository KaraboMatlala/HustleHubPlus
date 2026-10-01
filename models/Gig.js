const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

// Marketplace listing: active gigs, newest first.
gigSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Gig", gigSchema);
