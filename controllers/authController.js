const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("../models/User");

// Roles a person may pick for themselves. "admin" must never be self-assigned.
const SELF_SERVICE_ROLES = ["client", "freelancer"];

// bcrypt only uses the first 72 bytes of a password.
const MAX_PASSWORD_LENGTH = 72;

// Compared against when the email doesn't exist so a missing account and a
// wrong password take about the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const isText = (value) => typeof value === "string";


// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!isText(name) || !isText(email) || !isText(password)
            || !name.trim() || !email.trim() || !password) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (name.trim().length > 80) {
            return res.status(400).json({
                message: "Name must be 80 characters or fewer."
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        if (password.length > MAX_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
            });
        }

        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain uppercase letter and number."
            });
        }

        // Role is optional (defaults to client) but must be a permitted value.
        let chosenRole = "client";

        if (role !== undefined) {
            if (!isText(role) || !SELF_SERVICE_ROLES.includes(role)) {
                return res.status(400).json({
                    message: "Role must be either client or freelancer."
                });
            }

            chosenRole = role;
        }

        const normalisedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalisedEmail });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalisedEmail,
            password: hashedPassword,
            role: chosenRole
        });

        return res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        // Two simultaneous sign-ups with the same email can slip past the
        // findOne check; the unique index catches the second one.
        if (error && error.code === 11000) {
            return res.status(409).json({
                message: "User already exists."
            });
        }

        console.error("Register error:", error);

        return res.status(500).json({
            message: "Registration failed."
        });
    }
};


// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Previously a missing email crashed on email.toLowerCase() (500).
        if (!isText(email) || !isText(password) || !email.trim() || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        const match = await bcrypt.compare(
            password,
            user ? user.password : DUMMY_HASH
        );

        if (!user || !match) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed."
        });
    }
};


// PROTECTED PROFILE
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.json({
            message: "Protected route accessed.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Profile failed."
        });
    }
};


module.exports = {
    register,
    login,
    getProfile
};
