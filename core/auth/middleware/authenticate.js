const { verifyToken, extractJti } = require('../utils/jwtUtils');
const tokenService = require('../services/tokenService');

/**
 * Middleware to require authentication
 * Adds req.user and req.token
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = verifyToken(token);

        if (decoded.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const jti = extractJti(decoded);

        // Verify token exists in database and hasn't been used/revoked
        await tokenService.verifyAccessToken(token, jti);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            username: decoded.sub,
            email: decoded.email,
            role: decoded.role
        };
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware to require admin role
 * Must be used after authenticate middleware
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = {
    authenticate,
    requireAdmin
};
