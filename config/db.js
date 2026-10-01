const mongoose = require("mongoose");

// Throws if the connection fails - server.js decides what to do about it.
// (It used to swallow the error, so the server kept running with no database
// and every request just hung until it timed out.)
const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
    });

    console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
};

module.exports = connectDB;
