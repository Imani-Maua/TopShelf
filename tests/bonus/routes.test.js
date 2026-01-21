const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Bonus Calculation API', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/bonuses/calculate', () => {
        it('should calculate bonuses for valid month/year with revenue above threshold', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('forecastMet');
            expect(response.body.data).toHaveProperty('revenues');
            expect(response.body.data).toHaveProperty('payouts');
            expect(response.body.data.forecastMet).toBe(true);
            expect(Array.isArray(response.body.data.payouts)).toBe(true);
        });

        it('should return bonuses with detailed breakdown per category', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            const payouts = response.body.data.payouts;

            // Check structure of payouts
            payouts.forEach(payout => {
                expect(payout).toHaveProperty('participant');
                expect(payout.participant).toHaveProperty('id');
                expect(payout.participant).toHaveProperty('name');
                expect(payout).toHaveProperty('amount');
                expect(payout).toHaveProperty('breakdown');
                expect(Array.isArray(payout.breakdown)).toBe(true);

                // Check breakdown structure
                payout.breakdown.forEach(categoryBreakdown => {
                    expect(categoryBreakdown).toHaveProperty('category');
                    expect(categoryBreakdown).toHaveProperty('bonus');
                    expect(categoryBreakdown).toHaveProperty('items');
                    expect(Array.isArray(categoryBreakdown.items)).toBe(true);
                });
            });
        });

        it('should include participants with $0 bonuses (below threshold)', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            const payouts = response.body.data.payouts;

            // Find Diana Martinez who should have $0 bonus
            const zeroBonus = payouts.find(p => p.amount === 0);
            expect(zeroBonus).toBeDefined();
            expect(zeroBonus.breakdown.length).toBeGreaterThan(0);

            // Check that items have reasons for not qualifying
            zeroBonus.breakdown.forEach(categoryBreakdown => {
                categoryBreakdown.items.forEach(item => {
                    expect(item.qualified).toBe(false);
                    expect(item.reason).toBeDefined();
                    expect(item.reason).toContain('Below minimum threshold');
                });
            });
        });

        it('should sort payouts by amount descending', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            const payouts = response.body.data.payouts;

            // Verify descending order
            for (let i = 1; i < payouts.length; i++) {
                expect(payouts[i - 1].amount).toBeGreaterThanOrEqual(payouts[i].amount);
            }
        });

        it('should handle PER_ITEM calculation mode correctly', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            const payouts = response.body.data.payouts;

            // Find a payout with steaks (PER_ITEM mode)
            const steakPayout = payouts.find(p =>
                p.breakdown.some(b => b.category === 'High-End Steaks')
            );

            if (steakPayout) {
                const steakBreakdown = steakPayout.breakdown.find(b => b.category === 'High-End Steaks');

                // In PER_ITEM mode, each product should have a productName
                steakBreakdown.items.forEach(item => {
                    expect(item.productName).toBeDefined();
                    expect(item.productName).not.toBeNull();
                });
            }
        });

        it('should handle PER_CATEGORY calculation mode correctly', async () => {
            const requestBody = {
                month: 1,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(200);

            const payouts = response.body.data.payouts;

            // Find a payout with cocktails (PER_CATEGORY mode)
            const cocktailPayout = payouts.find(p =>
                p.breakdown.some(b => b.category === 'Cocktails')
            );

            if (cocktailPayout) {
                const cocktailBreakdown = cocktailPayout.breakdown.find(b => b.category === 'Cocktails');

                // In PER_CATEGORY mode, productName should be null, but products array should exist
                cocktailBreakdown.items.forEach(item => {
                    expect(item.productName).toBeNull();
                    expect(item.products).toBeDefined();
                    expect(Array.isArray(item.products)).toBe(true);
                });
            }
        });

        it('should reject calculation without month', async () => {
            const requestBody = {
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject calculation without year', async () => {
            const requestBody = {
                month: 1,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject calculation without totalRevenue', async () => {
            const requestBody = {
                month: 1,
                year: 2026
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject calculation with invalid month (0)', async () => {
            const requestBody = {
                month: 0,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject calculation with invalid month (13)', async () => {
            const requestBody = {
                month: 13,
                year: 2026,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should return error for month/year with no forecast', async () => {
            const requestBody = {
                month: 12,
                year: 2099,
                totalRevenue: 55000
            };

            const response = await request(app)
                .post('/api/bonuses/calculate')
                .send(requestBody)
                .expect(404);

            expect(response.body.error).toBe('Not Found');
            expect(response.body.message).toContain('Forecast not found');
        });
    });

    describe('Health Check', () => {
        it('should return API health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });
});
