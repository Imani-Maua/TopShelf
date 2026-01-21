const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Participants API', () => {
    let createdParticipantId;

    // Clean up test data after all tests
    afterAll(async () => {
        if (createdParticipantId) {
            try {
                await prisma.participant.delete({
                    where: { id: createdParticipantId }
                });
            } catch (error) {
                // Participant may already be deleted
            }
        }
        await prisma.$disconnect();
    });

    describe('GET /api/participants', () => {
        it('should return all participants', async () => {
            const response = await request(app)
                .get('/api/participants')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');
        });
    });

    describe('POST /api/participants', () => {
        it('should create a new participant with valid data', async () => {
            const newParticipant = {
                firstname: 'Test',
                lastname: 'User'
            };

            const response = await request(app)
                .post('/api/participants')
                .send(newParticipant)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.firstname).toBe(newParticipant.firstname);
            expect(response.body.data.lastname).toBe(newParticipant.lastname);

            // Store ID for cleanup
            createdParticipantId = response.body.data.id;
        });

        it('should reject participant creation without firstname', async () => {
            const invalidParticipant = {
                lastname: 'User'
            };

            const response = await request(app)
                .post('/api/participants')
                .send(invalidParticipant)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject participant creation without lastname', async () => {
            const invalidParticipant = {
                firstname: 'Test'
            };

            const response = await request(app)
                .post('/api/participants')
                .send(invalidParticipant)
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/participants/:id', () => {
        it('should return a specific participant', async () => {
            // First create a participant
            const newParticipant = await prisma.participant.create({
                data: {
                    firstname: 'Get',
                    lastname: 'Test'
                }
            });

            const response = await request(app)
                .get(`/api/participants/${newParticipant.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(newParticipant.id);
            expect(response.body.data.firstname).toBe('Get');
            expect(response.body.data.lastname).toBe('Test');

            // Cleanup
            await prisma.participant.delete({
                where: { id: newParticipant.id }
            });
        });

        it('should return 404 for non-existent participant', async () => {
            const fakeId = '000000000000000000000000';
            await request(app)
                .get(`/api/participants/${fakeId}`)
                .expect(404);
        });

        it('should return 400 for invalid ID format', async () => {
            await request(app)
                .get('/api/participants/invalid-id')
                .expect(400);
        });
    });

    describe('PUT /api/participants/:id', () => {
        it('should update a participant with valid data', async () => {
            // Create a participant first
            const participant = await prisma.participant.create({
                data: {
                    firstname: 'Update',
                    lastname: 'Test'
                }
            });

            const updatedData = {
                firstname: 'Updated',
                lastname: 'Name'
            };

            const response = await request(app)
                .put(`/api/participants/${participant.id}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.firstname).toBe('Updated');
            expect(response.body.data.lastname).toBe('Name');

            // Cleanup
            await prisma.participant.delete({
                where: { id: participant.id }
            });
        });
    });

    describe('DELETE /api/participants/:id', () => {
        it('should delete a participant without receipts', async () => {
            // Create a participant
            const participant = await prisma.participant.create({
                data: {
                    firstname: 'Delete',
                    lastname: 'Test'
                }
            });

            const response = await request(app)
                .delete(`/api/participants/${participant.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');

            // Verify deletion
            const deleted = await prisma.participant.findUnique({
                where: { id: participant.id }
            });
            expect(deleted).toBeNull();
        });
    });
});
