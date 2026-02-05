const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const { createToken } = require('../../core/auth/utils/jwtUtils');
const { hashPassword } = require('../../core/auth/utils/passwordUtils');
const tokenService = require('../../core/auth/services/tokenService');

const prisma = new PrismaClient();

describe('Auth API', () => {
    let adminUser, regularUser, adminToken, regularToken;
    let testUserId;

    // Create test users before all tests
    beforeAll(async () => {
        // Create admin user
        const adminPasswordHash = await hashPassword('AdminPass123!');
        adminUser = await prisma.user.create({
            data: {
                username: 'testadmin',
                email: 'admin@test.com',
                firstname: 'Admin',
                lastname: 'User',
                role: 'admin',
                passwordHash: adminPasswordHash,
                isActive: true
            }
        });

        // Create regular user
        const userPasswordHash = await hashPassword('UserPass123!');
        regularUser = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'user@test.com',
                firstname: 'Regular',
                lastname: 'User',
                role: 'user',
                passwordHash: userPasswordHash,
                isActive: true
            }
        });

        // Create access tokens
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

    // Clean up after all tests
    afterAll(async () => {
        // Delete test users and their tokens (cascading)
        if (testUserId) {
            try {
                await prisma.user.delete({ where: { id: testUserId } });
            } catch (error) {
                // User may already be deleted
            }
        }
        if (adminUser) {
            await prisma.user.delete({ where: { id: adminUser.id } });
        }
        if (regularUser) {
            await prisma.user.delete({ where: { id: regularUser.id } });
        }
        await prisma.$disconnect();
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testadmin',
                    password: 'AdminPass123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.username).toBe('testadmin');
        });

        it('should reject invalid credentials', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testadmin',
                    password: 'wrongpassword'
                })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password'
                })
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('testadmin');
            expect(response.body.data.email).toBe('admin@test.com');
        });

        it('should reject request without token', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });

        it('should reject request with invalid token', async () => {
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('POST /api/auth/create-user (Admin)', () => {
        it('should create user as admin', async () => {
            const response = await request(app)
                .post('/api/auth/create-user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newuser',
                    email: 'newuser@test.com',
                    firstname: 'New',
                    lastname: 'User',
                    role: 'user'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('newuser');
            expect(response.body.data.isActive).toBe(false);

            // Store for cleanup
            testUserId = response.body.data.id;
        });

        it('should reject creation by non-admin', async () => {
            await request(app)
                .post('/api/auth/create-user')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    username: 'anotheruser',
                    email: 'another@test.com',
                    firstname: 'Another',
                    lastname: 'User'
                })
                .expect(403);
        });

        it('should reject creation without authentication', async () => {
            await request(app)
                .post('/api/auth/create-user')
                .send({
                    username: 'unauthuser',
                    email: 'unauth@test.com',
                    firstname: 'Unauth',
                    lastname: 'User'
                })
                .expect(401);
        });

        it('should reject duplicate username', async () => {
            await request(app)
                .post('/api/auth/create-user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'testadmin', // Duplicate
                    email: 'different@test.com',
                    firstname: 'Different',
                    lastname: 'User'
                })
                .expect(400);
        });
    });

    describe('GET /api/auth/users (Admin)', () => {
        it('should return all users for admin', async () => {
            const response = await request(app)
                .get('/api/auth/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.count).toBeGreaterThan(0);
        });

        it('should reject access by non-admin', async () => {
            await request(app)
                .get('/api/auth/users')
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);
        });
    });

    describe('PATCH /api/auth/users/:id/deactivate (Admin)', () => {
        it('should deactivate user as admin', async () => {
            // Create a user to deactivate
            const tempUser = await prisma.user.create({
                data: {
                    username: 'tempdeactivate',
                    email: 'tempdeactivate@test.com',
                    firstname: 'Temp',
                    lastname: 'Deactivate',
                    role: 'user',
                    passwordHash: await hashPassword('TempPass123!'),
                    isActive: true
                }
            });

            const response = await request(app)
                .patch(`/api/auth/users/${tempUser.id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user is deactivated
            const updated = await prisma.user.findUnique({ where: { id: tempUser.id } });
            expect(updated.isActive).toBe(false);

            // Cleanup
            await prisma.user.delete({ where: { id: tempUser.id } });
        });

        it('should reject deactivation by non-admin', async () => {
            await request(app)
                .patch(`/api/auth/users/${regularUser.id}/deactivate`)
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);
        });
    });

    describe('DELETE /api/auth/users/:id (Admin)', () => {
        it('should delete user as admin', async () => {
            // Create a user to delete
            const tempUser = await prisma.user.create({
                data: {
                    username: 'tempdelete',
                    email: 'tempdelete@test.com',
                    firstname: 'Temp',
                    lastname: 'Delete',
                    role: 'user',
                    passwordHash: await hashPassword('TempPass123!'),
                    isActive: false
                }
            });

            const response = await request(app)
                .delete(`/api/auth/users/${tempUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deletion
            const deleted = await prisma.user.findUnique({ where: { id: tempUser.id } });
            expect(deleted).toBeNull();
        });

        it('should reject deletion by non-admin', async () => {
            await request(app)
                .delete(`/api/auth/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);
        });

        it('should return 404 for non-existent user', async () => {
            await request(app)
                .delete('/api/auth/users/000000000000000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            // Create a temporary token for logout test
            const tempTokenData = await tokenService.createAccessToken(regularUser.id, {
                sub: regularUser.username,
                email: regularUser.email,
                role: regularUser.role
            });

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${tempTokenData.token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('Logged out');
        });

        it('should reject logout without token', async () => {
            await request(app)
                .post('/api/auth/logout')
                .expect(401);
        });
    });
});
