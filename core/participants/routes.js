const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateParticipant, validateObjectId } = require('./validators');

const prisma = new PrismaClient();

/**
 * GET /api/participants
 * Get all participants
 */
router.get('/', async (req, res) => {
    try {
        const participants = await prisma.participant.findMany({
            orderBy: [
                { lastname: 'asc' },
                { firstname: 'asc' }
            ]
        });

        res.status(200).json({
            success: true,
            data: participants,
            count: participants.length
        });

    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({
            error: 'Failed to fetch participants',
            message: error.message
        });
    }
});

/**
 * GET /api/participants/:id
 * Get a specific participant
 */
router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        const participant = await prisma.participant.findUnique({
            where: { id },
            include: {
                receipts: {
                    include: {
                        product: true
                    }
                },
                bonusPayouts: true
            }
        });

        if (!participant) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        res.status(200).json({
            success: true,
            data: participant
        });

    } catch (error) {
        console.error('Error fetching participant:', error);
        res.status(500).json({
            error: 'Failed to fetch participant',
            message: error.message
        });
    }
});

/**
 * POST /api/participants
 * Create a new participant
 */
router.post('/', validateParticipant, async (req, res) => {
    try {
        const { firstname, lastname } = req.body;

        // Check for duplicate
        const existing = await prisma.participant.findFirst({
            where: {
                firstname,
                lastname
            }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Participant already exists',
                details: ['A participant with this name already exists']
            });
        }

        const participant = await prisma.participant.create({
            data: { firstname, lastname }
        });

        res.status(201).json({
            success: true,
            data: participant
        });

    } catch (error) {
        console.error('Error creating participant:', error);
        res.status(500).json({
            error: 'Failed to create participant',
            message: error.message
        });
    }
});

/**
 * PUT /api/participants/:id
 * Update a participant
 */
router.put('/:id', validateObjectId, validateParticipant, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstname, lastname } = req.body;

        // Check if exists
        const existing = await prisma.participant.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        const participant = await prisma.participant.update({
            where: { id },
            data: { firstname, lastname }
        });

        res.status(200).json({
            success: true,
            data: participant
        });

    } catch (error) {
        console.error('Error updating participant:', error);
        res.status(500).json({
            error: 'Failed to update participant',
            message: error.message
        });
    }
});

/**
 * DELETE /api/participants/:id
 * Delete a participant
 */
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exists
        const existing = await prisma.participant.findUnique({
            where: { id },
            include: {
                receipts: true,
                bonusPayouts: true
            }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        // Check if has related records
        if (existing.receipts.length > 0 || existing.bonusPayouts.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete participant',
                details: ['Participant has associated receipts or bonus payouts']
            });
        }

        await prisma.participant.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Participant deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting participant:', error);
        res.status(500).json({
            error: 'Failed to delete participant',
            message: error.message
        });
    }
});

module.exports = router;
