const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Categories API', () => {
    let createdCategoryId;

    afterAll(async () => {
        // Clean up test categories
        if (createdCategoryId) {
            try {
                await prisma.tierRule.deleteMany({ where: { categoryId: createdCategoryId } });
                await prisma.category.delete({ where: { id: createdCategoryId } });
            } catch (error) {
                // May already be deleted
            }
        }
        await prisma.$disconnect();
    });

    describe('GET /api/categories', () => {
        it('should return all categories with tier rules', async () => {
            const response = await request(app)
                .get('/api/categories')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');

            // Verify tier rules are included
            if (response.body.data.length > 0) {
                const category = response.body.data[0];
                expect(category).toHaveProperty('tierRules');
                expect(Array.isArray(category.tierRules)).toBe(true);
                expect(category).toHaveProperty('products');
            }
        });

        it('should return categories sorted by name', async () => {
            const response = await request(app)
                .get('/api/categories')
                .expect(200);

            // Verify ascending name order
            for (let i = 1; i < response.body.data.length; i++) {
                const curr = response.body.data[i].name.toLowerCase();
                const prev = response.body.data[i - 1].name.toLowerCase();
                expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('GET /api/categories/:id', () => {
        it('should return a specific category with tier rules', async () => {
            const category = await prisma.category.findFirst({
                include: { tierRules: true }
            });

            if (category) {
                const response = await request(app)
                    .get(`/api/categories/${category.id}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.id).toBe(category.id);
                expect(response.body.data).toHaveProperty('tierRules');
            }
        }, 15000); // Increased timeout to 15 seconds for slow DB query

        it('should return 404 for non-existent category', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .get(`/api/categories/${fakeId}`)
                .expect(404);
        });

        it('should return 400 for invalid ID format', async () => {
            await request(app)
                .get('/api/categories/invalid-id')
                .expect(400);
        });
    });

    describe('POST /api/categories', () => {
        it('should create a category with valid tier rules', async () => {
            const newCategory = {
                name: 'Test Category',
                mode: 'PER_CATEGORY',
                tierRules: [
                    { minQuantity: 5, bonusPercentage: 5 },
                    { minQuantity: 10, bonusPercentage: 10 },
                    { minQuantity: 15, bonusPercentage: 15 }
                ]
            };

            const response = await request(app)
                .post('/api/categories')
                .send(newCategory)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe(newCategory.name);
            expect(response.body.data.mode).toBe(newCategory.mode);
            expect(response.body.data.tierRules).toHaveLength(3);

            createdCategoryId = response.body.data.id;
        });

        it('should reject category without name', async () => {
            const invalidCategory = {
                mode: 'PER_CATEGORY',
                tierRules: [{ minQuantity: 5, bonusPercentage: 5 }]
            };

            await request(app)
                .post('/api/categories')
                .send(invalidCategory)
                .expect(400);
        });

        it('should reject category without mode', async () => {
            const invalidCategory = {
                name: 'Test',
                tierRules: [{ minQuantity: 5, bonusPercentage: 5 }]
            };

            await request(app)
                .post('/api/categories')
                .send(invalidCategory)
                .expect(400);
        });

        it('should reject category with invalid mode', async () => {
            const invalidCategory = {
                name: 'Test',
                mode: 'INVALID_MODE',
                tierRules: [{ minQuantity: 5, bonusPercentage: 5 }]
            };

            await request(app)
                .post('/api/categories')
                .send(invalidCategory)
                .expect(400);
        });

        it('should reject tier rules with non-increasing minQuantity', async () => {
            const invalidCategory = {
                name: 'Test',
                mode: 'PER_CATEGORY',
                tierRules: [
                    { minQuantity: 10, bonusPercentage: 5 },
                    { minQuantity: 5, bonusPercentage: 10 } // Wrong order
                ]
            };

            await request(app)
                .post('/api/categories')
                .send(invalidCategory)
                .expect(400);
        });

        it('should reject tier rules with non-increasing bonusPercentage', async () => {
            const invalidCategory = {
                name: 'Test',
                mode: 'PER_CATEGORY',
                tierRules: [
                    { minQuantity: 5, bonusPercentage: 10 },
                    { minQuantity: 10, bonusPercentage: 5 } // Wrong order
                ]
            };

            await request(app)
                .post('/api/categories')
                .send(invalidCategory)
                .expect(400);
        });
    });

    describe('PUT /api/categories/:id', () => {
        it('should update a category with new tier rules', async () => {
            // Create a test category first
            const category = await prisma.category.create({
                data: {
                    name: 'Update Test',
                    mode: 'PER_CATEGORY',
                    tierRules: {
                        create: [
                            { minQuantity: 5, bonusPercentage: 5 }
                        ]
                    }
                }
            });

            const updatedData = {
                name: 'Updated Name',
                mode: 'PER_ITEM',
                tierRules: [
                    { minQuantity: 3, bonusPercentage: 5 },
                    { minQuantity: 6, bonusPercentage: 10 }
                ]
            };

            const response = await request(app)
                .put(`/api/categories/${category.id}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.mode).toBe('PER_ITEM');
            expect(response.body.data.tierRules).toHaveLength(2);

            // Cleanup
            await prisma.tierRule.deleteMany({ where: { categoryId: category.id } });
            await prisma.category.delete({ where: { id: category.id } });
        });

        it('should return 404 for non-existent category', async () => {
            const fakeId = '000000000000000000000000';
            const updateData = {
                name: 'Test',
                mode: 'PER_CATEGORY',
                tierRules: [{ minQuantity: 5, bonusPercentage: 5 }]
            };

            await request(app)
                .put(`/api/categories/${fakeId}`)
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        it('should delete a category without products', async () => {
            // Create a test category
            const category = await prisma.category.create({
                data: {
                    name: 'Delete Test',
                    mode: 'PER_CATEGORY',
                    tierRules: {
                        create: [{ minQuantity: 5, bonusPercentage: 5 }]
                    }
                }
            });

            const response = await request(app)
                .delete(`/api/categories/${category.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');

            // Verify deletion
            const deleted = await prisma.category.findUnique({
                where: { id: category.id }
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent category', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .delete(`/api/categories/${fakeId}`)
                .expect(404);
        });

        it('should reject deletion of category with products', async () => {
            // Get a category that has products
            const categoryWithProducts = await prisma.category.findFirst({
                include: { products: true },
                where: {
                    products: {
                        some: {}
                    }
                }
            });

            if (categoryWithProducts) {
                await request(app)
                    .delete(`/api/categories/${categoryWithProducts.id}`)
                    .expect(409);
            }
        });
    });
});
