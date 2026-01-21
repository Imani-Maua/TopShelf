const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Forecasts API', () => {
    let createdForecastId;

    afterAll(async () => {
        if (createdForecastId) {
            try {
                await prisma.forecast.delete({ where: { id: createdForecastId } });
            } catch (error) {
                // May already be deleted
            }
        }
        await prisma.$disconnect();
    });

    describe('GET /api/forecasts', () => {
        it('should return all forecasts sorted by year and month', async () => {
            const response = await request(app)
                .get('/api/forecasts')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');

            if (response.body.data.length > 1) {
                // Verify descending order (newest first)
                for (let i = 1; i < response.body.data.length; i++) {
                    const prev = response.body.data[i - 1];
                    const curr = response.body.data[i];

                    if (prev.year === curr.year) {
                        expect(prev.month).toBeGreaterThanOrEqual(curr.month);
                    } else {
                        expect(prev.year).toBeGreaterThan(curr.year);
                    }
                }
            }
        });
    });

    describe('GET /api/forecasts/:month/:year', () => {
        it('should return forecast for specific month/year', async () => {
            // We know January 2026 exists from seeding
            const response = await request(app)
                .get('/api/forecasts/1/2026')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.month).toBe(1);
            expect(response.body.data.year).toBe(2026);
            expect(response.body.data).toHaveProperty('targetAmount');
            expect(response.body.data).toHaveProperty('threshold');
        });

        it('should return 404 for non-existent forecast', async () => {
            await request(app)
                .get('/api/forecasts/12/2099')
                .expect(404);
        });

        it('should reject invalid month (0)', async () => {
            await request(app)
                .get('/api/forecasts/0/2026')
                .expect(400);
        });

        it('should reject invalid month (13)', async () => {
            await request(app)
                .get('/api/forecasts/13/2026')
                .expect(400);
        });

        it('should reject invalid year (negative)', async () => {
            await request(app)
                .get('/api/forecasts/1/-2026')
                .expect(400);
        });
    });

    describe('POST /api/forecasts', () => {
        it('should create a forecast with valid data', async () => {
            const newForecast = {
                month: 2,
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            const response = await request(app)
                .post('/api/forecasts')
                .send(newForecast)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.month).toBe(2);
            expect(response.body.data.year).toBe(2026);
            expect(response.body.data.targetAmount).toBe(60000);
            expect(response.body.data.threshold).toBe(0.85);

            createdForecastId = response.body.data.id;
        });

        it('should reject forecast without month', async () => {
            const invalidForecast = {
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast without year', async () => {
            const invalidForecast = {
                month: 3,
                targetAmount: 60000,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast without targetAmount', async () => {
            const invalidForecast = {
                month: 3,
                year: 2026,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast without threshold', async () => {
            const invalidForecast = {
                month: 3,
                year: 2026,
                targetAmount: 60000
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast with invalid month (0)', async () => {
            const invalidForecast = {
                month: 0,
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast with invalid month (13)', async () => {
            const invalidForecast = {
                month: 13,
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast with negative targetAmount', async () => {
            const invalidForecast = {
                month: 3,
                year: 2026,
                targetAmount: -1000,
                threshold: 0.85
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast with threshold > 1', async () => {
            const invalidForecast = {
                month: 3,
                year: 2026,
                targetAmount: 60000,
                threshold: 1.5
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject forecast with threshold < 0', async () => {
            const invalidForecast = {
                month: 3,
                year: 2026,
                targetAmount: 60000,
                threshold: -0.5
            };

            await request(app)
                .post('/api/forecasts')
                .send(invalidForecast)
                .expect(400);
        });

        it('should reject duplicate forecast for same month/year', async () => {
            const duplicateForecast = {
                month: 1,
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            const response = await request(app)
                .post('/api/forecasts')
                .send(duplicateForecast)
                .expect(409);

            expect(response.body.error).toBe('Forecast already exists');
        });
    });

    describe('PUT /api/forecasts/:id', () => {
        it('should update a forecast with valid data', async () => {
            // Create a forecast to update
            const forecast = await prisma.forecast.create({
                data: {
                    month: 4,
                    year: 2026,
                    targetAmount: 50000,
                    threshold: 0.80
                }
            });

            const updatedData = {
                month: 4,
                year: 2026,
                targetAmount: 55000,
                threshold: 0.85
            };

            const response = await request(app)
                .put(`/api/forecasts/${forecast.id}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.targetAmount).toBe(55000);
            expect(response.body.data.threshold).toBe(0.85);

            // Cleanup
            await prisma.forecast.delete({ where: { id: forecast.id } });
        });

        it('should return 404 for non-existent forecast', async () => {
            const fakeId = '000000000000000000000000';
            const updateData = {
                month: 5,
                year: 2026,
                targetAmount: 60000,
                threshold: 0.85
            };

            await request(app)
                .put(`/api/forecasts/${fakeId}`)
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /api/forecasts/:id', () => {
        it('should delete a forecast', async () => {
            // Create a forecast to delete
            const forecast = await prisma.forecast.create({
                data: {
                    month: 6,
                    year: 2026,
                    targetAmount: 50000,
                    threshold: 0.80
                }
            });

            const response = await request(app)
                .delete(`/api/forecasts/${forecast.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');

            // Verify deletion
            const deleted = await prisma.forecast.findUnique({
                where: { id: forecast.id }
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent forecast', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .delete(`/api/forecasts/${fakeId}`)
                .expect(404);
        });
    });
});
