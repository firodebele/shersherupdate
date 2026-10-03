const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        req.flash('error', 'Please login to continue');
        return res.redirect('/login'); // Redirect to login if no token is found
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.admin = decoded.admin; // Store decoded admin information in request object
        next();
    } catch (error) {
        console.error('JWT verification error:', error.message);
        req.flash('error', 'Session expired. Please login again');
        return res.redirect('/login'); // Redirect to login if token is invalid
    }
}

module.exports = authenticateToken;
