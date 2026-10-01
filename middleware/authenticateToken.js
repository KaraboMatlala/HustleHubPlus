const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"] || "";
    const [scheme, token] = authHeader.split(" ");

    if (!token || scheme.toLowerCase() !== "bearer") {
        return res.status(401).json({
            message: "Access denied. Authentication token is required."
        });
    }

    // Read the secret per request (not at require time) so it always matches
    // whatever dotenv / the test harness has loaded by then.
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // `code` lets the React app tell "your session expired" apart
            // from a normal "wrong role" 403 and log the user out.
            return res.status(403).json({
                message: "Invalid or expired token.",
                code: "TOKEN_INVALID"
            });
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
