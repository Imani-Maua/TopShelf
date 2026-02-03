const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword, generateTemporaryPassword, validatePasswordStrength } = require('../utils/passwordUtils');
const { createToken, verifyToken, extractJti } = require('../utils/jwtUtils');
const { generateInviteEmail } = require('../utils/emailUtils');
const tokenService = require('./tokenService');
const { sendEmail } = require('./emailService');


class UserService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Create a new user (Admin only)
     * User starts as inactive until they set their password via invite
     */
    async createUser(userData) {
        const { username, email, firstname, lastname, role = 'user' } = userData;

        // Validate required fields
        if (!username || !email || !firstname || !lastname) {
            throw new Error('All user fields are required');
        }

        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (existingUser) {
            throw new Error('User with this username or email already exists');
        }

        // Generate temporary password (will be replaced when they accept invite)
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);

        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                firstname,
                lastname,
                role,
                passwordHash,
                isActive: false
            }
        });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            isActive: user.isActive
        };
    }

    /**
     * Send invite to a user
     */
    async sendInvite(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isActive) {
            throw new Error('User is already active');
        }

        
        const invite = await tokenService.createInviteToken(user.id);

        const emailContent = generateInviteEmail(
            user.email,
            user.firstname,
            invite.token,
            process.env.FRONTEND_URL
        );

        await sendEmail(
            user.email,
            "Welcome to TopShelf",
            "You have been invited...",
            emailContent
        )
        console.log(`Invite sent to ${user.email}`);
        return {
            userId: user.id,
            email: user.email,
            inviteToken: invite.token,
            expiresAt: invite.expiresAt
        };
    }

    /**
     * Set password using invite token
     */
    async setPassword(inviteToken, newPassword) {
        // Validate password strength
        const strengthValidation = validatePasswordStrength(newPassword);
        if (!strengthValidation.valid) {
            throw new Error(strengthValidation.errors.join(', '));
        }

        try {
            // Verify and decode token
            const decoded = verifyToken(inviteToken);

            if (decoded.type !== 'invite') {
                throw new Error('Invalid token type');
            }

            const jti = extractJti(decoded);
            const userId = decoded.id;

            // Verify token in database
            await tokenService.verifyInviteToken(inviteToken, jti);

            // Hash new password
            const passwordHash = await hashPassword(newPassword);

            // Update user (activate and set password)
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash,
                    isActive: true
                }
            });

            // Mark token as used
            await tokenService.markInviteTokenUsed(jti);

            return { message: 'Password set successfully. You can now log in.' };

        } catch (error) {
            throw new Error('Invalid or expired invite token');
        }
    }

    /**
     * Login user
     */
    async login(username, password) {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account not activated. Please check your email for an invite.');
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Create access token
        const accessToken = await tokenService.createAccessToken(user.id, {
            sub: user.username,
            email: user.email,
            role: user.role
        });

        return {
            accessToken: accessToken.token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            }
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            isActive: user.isActive
        };
    }

    /**
     * Logout (invalidate token)
     */
    async logout(token) {
        const decoded = verifyToken(token);
        const jti = extractJti(decoded);
        await tokenService.markAccessTokenUsed(jti);
        return { message: 'Logged out successfully' };
    }

    /**
     * Get all users (Admin only)
     */
    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                firstname: true,
                lastname: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return users;
    }

    /**
     * Deactivate a user (Admin only)
     */
    async deactivateUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });

        return { message: 'User deactivated successfully' };
    }

    /**
     * Delete a user (Admin only)
     * Note: This will cascade delete related tokens
     */
    async deleteUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        await this.prisma.user.delete({
            where: { id: userId }
        });

        return { message: 'User deleted successfully' };
    }
}

module.exports = UserService;
