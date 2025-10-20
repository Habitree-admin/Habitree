const tokenService = require('../services/token.service');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado: Token no proporcionado',
        });
    }

    try {
        const decoded = tokenService.verifyAccessToken(token);
        req.user = decoded; // Attach user data to request
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            details: err.message,
        });
    }
};

module.exports = authMiddleware;