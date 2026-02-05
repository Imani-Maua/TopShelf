const { authenticate, requireAdmin } = require('../../../core/auth/middleware/authenticate');
const { PrismaClient } = require('@prisma/client');
const tokenService = require('../../../core/auth/services/tokenService');
const { hashPassword } = require('../../../core/auth/utils/passwordUtils');

const prisma = new PrismaClient();

describe('Authentication Middleware', () => {
    let adminUser, regularUser, adminToken, regularToken, expiredToken;
    let req, res, next;

    beforeAll(async () => {
        // Create admin user
        adminUser = await prisma.user.create({
            data: {
                username: 'middlewareadmin',
                email: 'middlewareadmin@test.com',
                firstname: 'Middleware',
                lastname: 'Admin',
                role: 'admin',
                passwordHash: await hashPassword('AdminPass123!'),
                isActive: true
            }
        });

        // Create regular user
        regularUser = await prisma.user.create({
            data: {
                username: 'middlewareuser',
                email: 'middlewareuser@test.com',
                firstname: 'Middleware',
                lastname: 'User',
                role: 'user',
                passwordHash: await hashPassword('UserPass123!'),
                isActive: true
            }
        });

        // Create tokens
        const adminTokenData = await tokenService.createAccessToken(adminUser.id, {
            sub: adminUser.username,
            email: adminUser.email,
            role: adminUser.role
        });
        adminToken = adminTokenData.token;

        const regularTokenData = await tokenService.createAccessToken(regularUser.id, {
            sub: regularUser.username,
            email: regularUser.email,
            role: regularUser.role
        });
        regularToken = regularTokenData.token;
    });

    afterAll(async () => {
        // Clean up test users
        await prisma.user.delete({ where: { id: adminUser.id } });
        await prisma.user.delete({ where: { id: regularUser.id } });
        await prisma.$disconnect();
    });

    beforeEach(() => {
        // Mock request and response objects
        req = {
            headers: {},
            user: null,
            token: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('authenticate middleware', () => {
        it('should authenticate valid admin token', async () => {
            req.headers.authorization = `Bearer ${adminToken}`;

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.role).toBe('admin');
            expect(req.user.username).toBe('middlewareadmin');
        });

        it('should authenticate valid user token', async () => {
            req.headers.authorization = `Bearer ${regularToken}`;

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.role).toBe('user');
        });

        it('should reject request without authorization header', async () => {
            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token format', async () => {
            req.headers.authorization = 'InvalidFormat token';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject invalid token', async () => {
            req.headers.authorization = 'Bearer invalid-token-string';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject empty bearer token', async () => {
            req.headers.authorization = 'Bearer ';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireAdmin middleware', () => {
        it('should allow admin user to proceed', () => {
            req.user = {
                id: adminUser.id,
                username: adminUser.username,
                role: 'admin'
            };

            requireAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject non-admin user', () => {
            req.user = {
                id: regularUser.id,
                username: regularUser.username,
                role: 'user'
            };

            requireAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request without user object', () => {
            requireAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
