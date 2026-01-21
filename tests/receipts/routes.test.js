const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Receipts API (READ-ONLY)', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /api/receipts', () => {
        it('should return receipts with pagination', async () => {
            const response = await request(app)
                .get('/api/receipts?limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(response.body.pagination).toHaveProperty('offset');
            expect(response.body.pagination).toHaveProperty('hasMore');
        }, 20000);

        it('should filter receipts by date range', async () => {
            const response = await request(app)
                .get('/api/receipts?startDate=2026-01-01&endDate=2026-01-31&limit=100')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.filters.startDate).toBe('2026-01-01');
            expect(response.body.filters.endDate).toBe('2026-01-31');

            // Verify all receipts are within date range
            response.body.data.forEach(receipt => {
                const receiptDate = new Date(receipt.date);
                expect(receiptDate.getTime()).toBeGreaterThanOrEqual(new Date('2026-01-01').getTime());
                expect(receiptDate.getTime()).toBeLessThanOrEqual(new Date('2026-01-31').getTime());
            });
        });

        it('should filter receipts by participant', async () => {
            // Get a participant ID first
            const participant = await prisma.participant.findFirst();

            if (participant) {
                const response = await request(app)
                    .get(`/api/receipts?participantId=${participant.id}&limit=50`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.filters.participantId).toBe(participant.id);

                // Verify all receipts belong to the participant
                response.body.data.forEach(receipt => {
                    expect(receipt.participantId).toBe(participant.id);
                });
            }
        }, 20000);

        it('should filter receipts by price range', async () => {
            const response = await request(app)
                .get('/api/receipts?minPrice=30&maxPrice=100&limit=50')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.filters.minPrice).toBe('30');
            expect(response.body.filters.maxPrice).toBe('100');

            // Verify all receipts are within price range
            response.body.data.forEach(receipt => {
                expect(receipt.price).toBeGreaterThanOrEqual(30);
                expect(receipt.price).toBeLessThanOrEqual(100);
            });
        });

        it('should sort receipts by date descending by default', async () => {
            const response = await request(app)
                .get('/api/receipts?limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify descending order
            for (let i = 1; i < response.body.data.length; i++) {
                const prevDate = new Date(response.body.data[i - 1].date);
                const currDate = new Date(response.body.data[i].date);
                expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
            }
        });

        it('should return receipt with full details (participant, product, category)', async () => {
            const response = await request(app)
                .get('/api/receipts?limit=1')
                .expect(200);

            if (response.body.data.length > 0) {
                const receipt = response.body.data[0];
                expect(receipt).toHaveProperty('participant');
                expect(receipt.participant).toHaveProperty('firstname');
                expect(receipt.participant).toHaveProperty('lastname');
                expect(receipt).toHaveProperty('product');
                expect(receipt.product).toHaveProperty('name');
                expect(receipt.product).toHaveProperty('category');
                expect(receipt.product.category).toHaveProperty('name');
                expect(receipt.product.category).toHaveProperty('mode');
            }
        });

        it('should reject invalid date format', async () => {
            const response = await request(app)
                .get('/api/receipts?startDate=invalid-date')
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject invalid ObjectId format', async () => {
            const response = await request(app)
                .get('/api/receipts?participantId=invalid-id')
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/receipts/:id', () => {
        it('should return a specific receipt', async () => {
            // Get a receipt ID first
            const receipt = await prisma.receipt.findFirst();

            if (receipt) {
                const response = await request(app)
                    .get(`/api/receipts/${receipt.id}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.id).toBe(receipt.id);
            }
        });

        it('should return 404 for non-existent receipt', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .get(`/api/receipts/${fakeId}`)
                .expect(404);
        });

        it('should return 400 for invalid ID format', async () => {
            await request(app)
                .get('/api/receipts/invalid-id')
                .expect(400);
        });
    });

    describe('GET /api/receipts/stats/summary', () => {
        it('should return receipt statistics', async () => {
            const response = await request(app)
                .get('/api/receipts/stats/summary?startDate=2026-01-01&endDate=2026-01-31')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalReceipts');
            expect(response.body.data).toHaveProperty('totalRevenue');
            expect(response.body.data).toHaveProperty('averagePrice');
            expect(typeof response.body.data.totalReceipts).toBe('number');
            expect(typeof response.body.data.totalRevenue).toBe('number');
            expect(typeof response.body.data.averagePrice).toBe('number');
        });

        it('should return statistics for specific participant', async () => {
            const participant = await prisma.participant.findFirst();

            if (participant) {
                const response = await request(app)
                    .get(`/api/receipts/stats/summary?participantId=${participant.id}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.totalReceipts).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('Receipt Integrity (READ-ONLY)', () => {
        it('should NOT allow creating receipts via POST', async () => {
            const newReceipt = {
                participantId: '000000000000000000000000',
                productId: '000000000000000000000000',
                price: 50.00,
                date: new Date()
            };

            // The POST endpoint should not exist
            const response = await request(app)
                .post('/api/receipts')
                .send(newReceipt);

            expect(response.status).toBe(404);
        });

        it('should NOT allow updating receipts via PUT', async () => {
            const receipt = await prisma.receipt.findFirst();

            if (receipt) {
                const response = await request(app)
                    .put(`/api/receipts/${receipt.id}`)
                    .send({ price: 100.00 });

                expect(response.status).toBe(404);
            }
        });

        it('should NOT allow deleting receipts via DELETE', async () => {
            const receipt = await prisma.receipt.findFirst();

            if (receipt) {
                const response = await request(app)
                    .delete(`/api/receipts/${receipt.id}`);

                expect(response.status).toBe(404);
            }
        });
    });
});