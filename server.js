require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const https = require("https");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

// Temporary user storage
const users = [];


// JWT AUTHENTICATION 

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Authentication token is required."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}


// HOME ROUTE

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});


// REGISTRATION ROUTE

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required."
        });
    }

    // Validate name
    if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
            message: "Name must be at least 2 characters long."
        });
    }

    // Validate email
    if (!validator.isEmail(email)) {
        return res.status(400).json({
            message: "Please provide a valid email address."
        });
    }

    // Validate password
    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long."
        });
    }

    // Check password complexity
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one uppercase letter."
        });
    }

    if (!/[0-9]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one number."
        });
    }

    // Check if email already exists
    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.status(409).json({
            message: "A user with this email already exists."
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
        id: users.length + 1,
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword
    };

    users.push(newUser);

    return res.status(201).json({
        message: "User registered successfully.",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    });
});


// LOGIN 

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    // Check that email and password were provided
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    // Find the user by email
    const user = users.find(
    user => user.email === email.toLowerCase()
);

    // If user does not exist
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    // Compare the entered password with the stored password hash
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    // If password is incorrect
    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    // Create JWT token
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    // Return successful login response
    res.status(200).json({
        message: "Login successful.",
        token: token
    });
});


// PROTECTED PROFILE 


app.get("/api/profile", authenticateToken, (req, res) => {
    const user = users.find(user => user.id === req.user.id);

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    res.status(200).json({
        message: "You have accessed a protected route.",
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});


// START SERVER


const sslOptions = {
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/cert.pem")
};

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HustleHub+ API is running securely on https://localhost:${PORT}`);
});