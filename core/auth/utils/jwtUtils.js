const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

/**
 * Create a JWT token
 * @param {object} payload - Data to encode in the token
 * @param {string} expiresIn - Expiration time (e.g., '7d', '24h')
 */
function createToken(payload, expiresIn) {
    // Add a unique JWT ID for tracking
    const jti = crypto.randomUUID();

    return {
        token: jwt.sign({ ...payload, jti }, JWT_SECRET, {
            expiresIn,
            algorithm: 'HS256'
        }),
        jti
    };
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Extract JWT ID from decoded token
 */
function extractJti(decoded) {
    if (!decoded.jti) {
        throw new Error('Token missing JTI');
    }
    return decoded.jti;
}

module.exports = {
    createToken,
    verifyToken,
    extractJti
};
