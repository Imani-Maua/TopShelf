const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Products API', () => {
    let createdProductId;
    let testCategoryId;

    beforeAll(async () => {
        // Create a test category for products
        const category = await prisma.category.create({
            data: {
                name: 'Test Product Category',
                mode: 'PER_ITEM',
                tierRules: {
                    create: [{ minQuantity: 5, bonusPercentage: 10 }]
                }
            }
        });
        testCategoryId = category.id;
    });

    afterAll(async () => {
        // Clean up test data
        if (createdProductId) {
            try {
                await prisma.product.delete({ where: { id: createdProductId } });
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

    describe('GET /api/products', () => {
        it('should return all products with categories', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');

            if (response.body.data.length > 0) {
                const product = response.body.data[0];
                expect(product).toHaveProperty('category');
                expect(product.category).toHaveProperty('name');
            }
        });

        it('should filter products by category', async () => {
            const category = await prisma.category.findFirst();

            if (category) {
                const response = await request(app)
                    .get(`/api/products?categoryId=${category.id}`)
                    .expect(200);

                expect(response.body.success).toBe(true);

                // All products should belong to the requested category
                response.body.data.forEach(product => {
                    expect(product.categoryId).toBe(category.id);
                });
            }
        });

        it('should return products sorted by name', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            // Verify ascending name order
            for (let i = 1; i < response.body.data.length; i++) {
                const curr = response.body.data[i].name.toLowerCase();
                const prev = response.body.data[i - 1].name.toLowerCase();
                expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
            }
        });
});

describe('GET /api/products/:id', () => {
    it('should return a specific product with category', async () => {
        const product = await prisma.product.findFirst();

        if (product) {
            const response = await request(app)
                .get(`/api/products/${product.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(product.id);
            expect(response.body.data).toHaveProperty('category');
        }
    });

    it('should return 404 for non-existent product', async () => {
        const fakeId = '000000000000000000000000';
        await request(app)
            .get(`/api/products/${fakeId}`)
            .expect(404);
    });

    it('should return 400 for invalid ID format', async () => {
        await request(app)
            .get('/api/products/invalid-id')
            .expect(400);
    });
});

describe('POST /api/products', () => {
    it('should create a product with valid data', async () => {
        const newProduct = {
            name: 'Test Product',
            price: 25.99,
            categoryId: testCategoryId
        };

        const response = await request(app)
            .post('/api/products')
            .send(newProduct)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(newProduct.name);
        expect(response.body.data.price).toBe(newProduct.price);
        expect(response.body.data.categoryId).toBe(testCategoryId);

        createdProductId = response.body.data.id;
    });

    it('should reject product without name', async () => {
        const invalidProduct = {
            price: 25.99,
            categoryId: testCategoryId
        };

        await request(app)
            .post('/api/products')
            .send(invalidProduct)
            .expect(400);
    });

    it('should reject product without price', async () => {
        const invalidProduct = {
            name: 'Test',
            categoryId: testCategoryId
        };

        await request(app)
            .post('/api/products')
            .send(invalidProduct)
            .expect(400);
    });

    it('should reject product without categoryId', async () => {
        const invalidProduct = {
            name: 'Test',
            price: 25.99
        };

        await request(app)
            .post('/api/products')
            .send(invalidProduct)
            .expect(400);
    });

    it('should reject product with negative price', async () => {
        const invalidProduct = {
            name: 'Test',
            price: -10,
            categoryId: testCategoryId
        };

        await request(app)
            .post('/api/products')
            .send(invalidProduct)
            .expect(400);
    });

    it('should reject product with non-existent category', async () => {
        const invalidProduct = {
            name: 'Test',
            price: 25.99,
            categoryId: '000000000000000000000000'
        };

        await request(app)
            .post('/api/products')
            .send(invalidProduct)
            .expect(404);
    });
});

describe('PUT /api/products/:id', () => {
    it('should update a product with valid data', async () => {
        // Create a test product
        const product = await prisma.product.create({
            data: {
                name: 'Update Test',
                price: 20.00,
                categoryId: testCategoryId
            }
        });

        const updatedData = {
            name: 'Updated Product',
            price: 30.00,
            categoryId: testCategoryId
        };

        const response = await request(app)
            .put(`/api/products/${product.id}`)
            .send(updatedData)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Product');
        expect(response.body.data.price).toBe(30.00);

        // Cleanup
        await prisma.product.delete({ where: { id: product.id } });
    });

    it('should return 404 for non-existent product', async () => {
        const fakeId = '000000000000000000000000';
        const updateData = {
            name: 'Test',
            price: 25.99,
            categoryId: testCategoryId
        };

        await request(app)
            .put(`/api/products/${fakeId}`)
            .send(updateData)
            .expect(404);
    });
});

describe('DELETE /api/products/:id', () => {
    it('should delete a product without receipts', async () => {
        // Create a test product
        const product = await prisma.product.create({
            data: {
                name: 'Delete Test',
                price: 15.00,
                categoryId: testCategoryId
            }
        });

        const response = await request(app)
            .delete(`/api/products/${product.id}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify deletion
        const deleted = await prisma.product.findUnique({
            where: { id: product.id }
        });
        expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
        const fakeId = '000000000000000000000000';
        await request(app)
            .delete(`/api/products/${fakeId}`)
            .expect(404);
    });

    it('should reject deletion of product with receipts', async () => {
        // Get a product that has receipts
        const productWithReceipts = await prisma.product.findFirst({
            include: { receipts: true },
            where: {
                receipts: {
                    some: {}
                }
            }
        });

        if (productWithReceipts) {
            await request(app)
                .delete(`/api/products/${productWithReceipts.id}`)
                .expect(409);
        }
    });
});
});
