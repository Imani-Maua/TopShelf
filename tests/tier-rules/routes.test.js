const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Tier Rules API', () => {
    let testCategoryId;
    let createdTierRuleId;

    beforeAll(async () => {
        // Create a test category
        const category = await prisma.category.create({
            data: {
                name: 'Tier Rule Test Category',
                mode: 'PER_CATEGORY',
                tierRules: {
                    create: [
                        { minQuantity: 5, bonusPercentage: 5 },
                        { minQuantity: 10, bonusPercentage: 10 }
                    ]
                }
            }
        });
        testCategoryId = category.id;
    });

    afterAll(async () => {
        if (createdTierRuleId) {
            try {
                await prisma.tierRule.delete({ where: { id: createdTierRuleId } });
            } catch (error) {
                // May already be deleted
            }
        }

        if (testCategoryId) {
            await prisma.tierRule.deleteMany({ where: { categoryId: testCategoryId } });
            await prisma.category.delete({ where: { id: testCategoryId } });
        }

        await prisma.$disconnect();
    });

    describe('GET /api/tier-rules', () => {
        it('should return all tier rules', async () => {
            const response = await request(app)
                .get('/api/tier-rules')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');

            if (response.body.data.length > 0) {
                const tierRule = response.body.data[0];
                expect(tierRule).toHaveProperty('categoryName');
                expect(tierRule).toHaveProperty('categoryMode');
                expect(tierRule).toHaveProperty('minQuantity');
                expect(tierRule).toHaveProperty('bonusPercentage');
            }
        });
    });

    describe('GET /api/tier-rules/category/:categoryId', () => {
        it('should return tier rules for a specific category', async () => {
            const response = await request(app)
                .get(`/api/tier-rules/category/${testCategoryId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('category');
            expect(response.body.data).toHaveProperty('tierRules');
            expect(Array.isArray(response.body.data.tierRules)).toBe(true);

            // Verify category info
            expect(response.body.data.category.id).toBe(testCategoryId);

            // All rules should belong to the requested category
            response.body.data.tierRules.forEach(rule => {
                expect(rule.categoryId).toBe(testCategoryId);
            });

            // Should be sorted by minQuantity
            for (let i = 1; i < response.body.data.tierRules.length; i++) {
                expect(response.body.data.tierRules[i].minQuantity)
                    .toBeGreaterThan(response.body.data.tierRules[i - 1].minQuantity);
            }
        });

        it('should return 404 for non-existent category', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .get(`/api/tier-rules/category/${fakeId}`)
                .expect(404);
        });

        it('should return 400 for invalid category ID format', async () => {
            await request(app)
                .get('/api/tier-rules/category/invalid-id')
                .expect(400);
        });
    });

    describe('POST /api/tier-rules', () => {
        it('should create a tier rule that maintains monotonic order', async () => {
            const newTierRule = {
                categoryId: testCategoryId,
                minQuantity: 15,
                bonusPercentage: 15
            };

            const response = await request(app)
                .post('/api/tier-rules')
                .send(newTierRule)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.minQuantity).toBe(15);
            expect(response.body.data.bonusPercentage).toBe(15);

            createdTierRuleId = response.body.data.id;
        });

        it('should reject tier rule without categoryId', async () => {
            const invalidTierRule = {
                minQuantity: 20,
                bonusPercentage: 20
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule without minQuantity', async () => {
            const invalidTierRule = {
                categoryId: testCategoryId,
                bonusPercentage: 20
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule without bonusPercentage', async () => {
            const invalidTierRule = {
                categoryId: testCategoryId,
                minQuantity: 20
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule with duplicate minQuantity', async () => {
            const duplicateTierRule = {
                categoryId: testCategoryId,
                minQuantity: 10, // Already exists
                bonusPercentage: 20
            };

            await request(app)
                .post('/api/tier-rules')
                .send(duplicateTierRule)
                .expect(400);
        });

        it('should reject tier rule with non-monotonic minQuantity', async () => {
            const invalidTierRule = {
                categoryId: testCategoryId,
                minQuantity: 12, // Between existing 10 and new
                bonusPercentage: 8 // Less than 10% at minQuantity 10
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule with negative minQuantity', async () => {
            const invalidTierRule = {
                categoryId: testCategoryId,
                minQuantity: -5,
                bonusPercentage: 10
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule with negative bonusPercentage', async () => {
            const invalidTierRule = {
                categoryId: testCategoryId,
                minQuantity: 20,
                bonusPercentage: -10
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(400);
        });

        it('should reject tier rule for non-existent category', async () => {
            const invalidTierRule = {
                categoryId: '000000000000000000000000',
                minQuantity: 20,
                bonusPercentage: 20
            };

            await request(app)
                .post('/api/tier-rules')
                .send(invalidTierRule)
                .expect(404);
        });
    });

    describe('PUT /api/tier-rules/:id', () => {
        it('should update a tier rule while maintaining monotonic order', async () => {
            // Get a tier rule to update
            const tierRules = await prisma.tierRule.findMany({
                where: { categoryId: testCategoryId },
                orderBy: { minQuantity: 'asc' }
            });

            if (tierRules.length > 0) {
                const tierRuleToUpdate = tierRules[0];

                const updatedData = {
                    minQuantity: tierRuleToUpdate.minQuantity, // Keep same
                    bonusPercentage: 6 // Slightly increase
                };

                const response = await request(app)
                    .put(`/api/tier-rules/${tierRuleToUpdate.id}`)
                    .send(updatedData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.bonusPercentage).toBe(6);
            }
        });

        it('should return 404 for non-existent tier rule', async () => {
            const fakeId = '000000000000000000000000';
            const updateData = {
                minQuantity: 20,
                bonusPercentage: 20
            };

            await request(app)
                .put(`/api/tier-rules/${fakeId}`)
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /api/tier-rules/:id', () => {
        it('should delete a tier rule', async () => {
            // Create a tier rule to delete
            const tierRule = await prisma.tierRule.create({
                data: {
                    categoryId: testCategoryId,
                    minQuantity: 25,
                    bonusPercentage: 20
                }
            });

            const response = await request(app)
                .delete(`/api/tier-rules/${tierRule.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');

            // Verify deletion
            const deleted = await prisma.tierRule.findUnique({
                where: { id: tierRule.id }
            });
            expect(deleted).toBeNull();
        });

        it('should prevent deletion of last tier rule for category', async () => {
            // Create a category with only one tier rule
            const category = await prisma.category.create({
                data: {
                    name: 'Single Tier Category',
                    mode: 'PER_CATEGORY',
                    tierRules: {
                        create: [{ minQuantity: 5, bonusPercentage: 5 }]
                    }
                },
                include: { tierRules: true }
            });

            const tierRuleId = category.tierRules[0].id;

            const response = await request(app)
                .delete(`/api/tier-rules/${tierRuleId}`)
                .expect(409);

            expect(response.body.error).toBe('Cannot delete tier rule');

            // Cleanup
            await prisma.tierRule.deleteMany({ where: { categoryId: category.id } });
            await prisma.category.delete({ where: { id: category.id } });
        });

        it('should return 404 for non-existent tier rule', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .delete(`/api/tier-rules/${fakeId}`)
                .expect(404);
        });
    });
});
