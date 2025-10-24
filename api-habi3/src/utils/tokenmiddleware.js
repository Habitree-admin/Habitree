const tokenService = require('../services/token.service');

/**
 * This function validates JWT access token in a request header
 * 
 * authMiddleware verifies Bearer token and attaches decoded user data to request or returns 401 error
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    // check request header
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied: Token not provided',
        });
    }

    try {
        const decoded = tokenService.verifyAccessToken(token);
        req.user = decoded; // Attach user data to request
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            details: err.message,
        });
    }
};

module.exports = authMiddleware;