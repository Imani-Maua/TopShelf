const { PrismaClient } = require('@prisma/client');
const { createToken } = require('./utils/jwtUtils');
const { hashPassword } = require('./utils/passwordUtils');

const INVITE_EXPIRY = process.env.INVITE_TOKEN_EXPIRY_HOURS || '168'; // 7 days default
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY_DAYS || '7'; // 7 days default

class TokenService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Create an invite token for a user
     */
    async createInviteToken(userId) {
        const expiresIn = `${INVITE_EXPIRY}h`;
        const expiresAt = new Date(Date.now() + parseInt(INVITE_EXPIRY) * 60 * 60 * 1000);

        const { token, jti } = createToken(
            { id: userId, type: 'invite' },
            expiresIn
        );

        // Hash the token for storage
        const tokenHash = await hashPassword(token);

        await this.prisma.inviteToken.create({
            data: {
                userId,
                tokenHash,
                jti,
                expiresAt
            }
        });

        return { token, jti, expiresAt };
    }

    /**
     * Create an access token for a user
     */
    async createAccessToken(userId, extraPayload = {}) {
        const expiresIn = `${ACCESS_EXPIRY}d`;
        const expiresAt = new Date(Date.now() + parseInt(ACCESS_EXPIRY) * 24 * 60 * 60 * 1000);

        const { token, jti } = createToken(
            { id: userId, type: 'access', ...extraPayload },
            expiresIn
        );

        // Hash the token for storage
        const tokenHash = await hashPassword(token);

        await this.prisma.accessToken.create({
            data: {
                userId,
                tokenHash,
                jti,
                expiresAt
            }
        });

        return { token, jti, expiresAt };
    }

    /**
     * Verify an invite token
     */
    async verifyInviteToken(token, jti) {
        const record = await this.prisma.inviteToken.findUnique({
            where: { jti }
        });

        if (!record) {
            throw new Error('Token not found');
        }

        if (record.usedAt) {
            throw new Error('Token already used');
        }

        if (new Date() > record.expiresAt) {
            throw new Error('Token expired');
        }

        return record;
    }

    /**
     * Verify an access token
     */
    async verifyAccessToken(token, jti) {
        const record = await this.prisma.accessToken.findUnique({
            where: { jti }
        });

        if (!record) {
            throw new Error('Token not found');
        }

        if (record.usedAt) {
            throw new Error('Token revoked');
        }

        if (new Date() > record.expiresAt) {
            throw new Error('Token expired');
        }

        return record;
    }

    /**
     * Mark invite token as used
     */
    async markInviteTokenUsed(jti) {
        await this.prisma.inviteToken.update({
            where: { jti },
            data: { usedAt: new Date() }
        });
    }

    /**
     * Mark access token as used (for logout)
     */
    async markAccessTokenUsed(jti) {
        await this.prisma.accessToken.update({
            where: { jti },
            data: { usedAt: new Date() }
        });
    }

    /**
     * Clean up expired tokens (run periodically)
     */
    async cleanupExpiredTokens() {
        const now = new Date();

        const inviteResult = await this.prisma.inviteToken.deleteMany({
            where: { expiresAt: { lt: now } }
        });

        const accessResult = await this.prisma.accessToken.deleteMany({
            where: { expiresAt: { lt: now } }
        });

        return {
            inviteTokensDeleted: inviteResult.count,
            accessTokensDeleted: accessResult.count
        };
    }
}

module.exports = new TokenService();
