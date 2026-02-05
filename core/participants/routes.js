const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateParticipant, validateObjectId } = require('./validators');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { requireOperations } = require('../auth/middleware/authenticate');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/', validateParticipant, requireOperations, async (req, res) => {
    try {
        const { firstname, lastname } = req.body;

        // Check for duplicate (case-insensitive)
        const existing = await prisma.participant.findFirst({
            where: {
                AND: [
                    { firstname: { equals: firstname, mode: 'insensitive' } },
                    { lastname: { equals: lastname, mode: 'insensitive' } }
                ]
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
router.put('/:id', validateObjectId, validateParticipant, requireOperations, async (req, res) => {
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
router.delete('/:id', validateObjectId, requireOperations, async (req, res) => {
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

/**
 * POST /api/participants/upload-csv
 * Bulk import participants from CSV
 */
router.post('/upload-csv', upload.single('file'), requireOperations, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                details: ['Please upload a CSV file']
            });
        }

        const results = [];
        const errors = [];
        const duplicates = [];

        // Parse CSV
        const stream = Readable.from(req.file.buffer.toString());

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    results.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Process each row
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNum = i + 2; // +2 because CSV is 1-indexed and has header

            // Validate required fields
            if (!row.firstname || !row.lastname) {
                errors.push({
                    row: rowNum,
                    message: 'Missing required fields (firstname, lastname)'
                });
                continue;
            }

            // Check for duplicate in database
            const existing = await prisma.participant.findFirst({
                where: {
                    AND: [
                        { firstname: { equals: row.firstname.trim(), mode: 'insensitive' } },
                        { lastname: { equals: row.lastname.trim(), mode: 'insensitive' } }
                    ]
                }
            });

            if (existing) {
                duplicates.push({
                    row: rowNum,
                    name: `${row.firstname} ${row.lastname}`
                });
                continue;
            }

            // Create participant
            try {
                await prisma.participant.create({
                    data: {
                        firstname: row.firstname.trim(),
                        lastname: row.lastname.trim()
                    }
                });
            } catch (err) {
                errors.push({
                    row: rowNum,
                    message: err.message
                });
            }
        }

        const processed = results.length - errors.length - duplicates.length;

        res.status(200).json({
            success: true,
            data: {
                processed,
                total: results.length,
                duplicates: duplicates.length,
                errors: errors.length,
                duplicateDetails: duplicates,
                errorDetails: errors
            }
        });

    } catch (error) {
        console.error('Error uploading CSV:', error);
        res.status(500).json({
            error: 'Failed to process CSV',
            message: error.message
        });
    }
});

module.exports = router;
