const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateForecast, validateObjectId, validateMonthYear } = require('./validators');

const prisma = new PrismaClient();

/**
 * GET /api/forecasts
 * Get all forecasts
 */
router.get('/', async (req, res) => {
    try {
        const forecasts = await prisma.forecast.findMany({
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        res.status(200).json({
            success: true,
            data: forecasts,
            count: forecasts.length
        });

    } catch (error) {
        console.error('Error fetching forecasts:', error);
        res.status(500).json({
            error: 'Failed to fetch forecasts',
            message: error.message
        });
    }
});

/**
 * GET /api/forecasts/:month/:year
 * Get forecast for a specific month/year
 */
router.get('/:month/:year', validateMonthYear, async (req, res) => {
    try {
        const month = parseInt(req.params.month);
        const year = parseInt(req.params.year);

        const forecast = await prisma.forecast.findFirst({
            where: { month, year }
        });

        if (!forecast) {
            return res.status(404).json({
                error: 'Forecast not found',
                details: [`No forecast found for ${month}/${year}`]
            });
        }

        res.status(200).json({
            success: true,
            data: forecast
        });

    } catch (error) {
        console.error('Error fetching forecast:', error);
        res.status(500).json({
            error: 'Failed to fetch forecast',
            message: error.message
        });
    }
});

/**
 * POST /api/forecasts
 * Create a new forecast
 */
router.post('/', validateForecast, async (req, res) => {
    try {
        const { month, year, targetAmount, threshold } = req.body;

        // Check for duplicate
        const existing = await prisma.forecast.findFirst({
            where: { month, year }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Forecast already exists',
                details: [`A forecast for ${month}/${year} already exists`]
            });
        }

        const forecast = await prisma.forecast.create({
            data: {
                month,
                year,
                targetAmount,
                threshold
            }
        });

        res.status(201).json({
            success: true,
            data: forecast
        });

    } catch (error) {
        console.error('Error creating forecast:', error);
        res.status(500).json({
            error: 'Failed to create forecast',
            message: error.message
        });
    }
});

/**
 * PUT /api/forecasts/:id
 * Update a forecast
 */
router.put('/:id', validateObjectId, validateForecast, async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year, targetAmount, threshold } = req.body;

        // Check if exists
        const existing = await prisma.forecast.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Forecast not found'
            });
        }

        const forecast = await prisma.forecast.update({
            where: { id },
            data: {
                month,
                year,
                targetAmount,
                threshold
            }
        });

        res.status(200).json({
            success: true,
            data: forecast
        });

    } catch (error) {
        console.error('Error updating forecast:', error);
        res.status(500).json({
            error: 'Failed to update forecast',
            message: error.message
        });
    }
});

/**
 * DELETE /api/forecasts/:id
 * Delete a forecast
 */
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exists
        const existing = await prisma.forecast.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Forecast not found'
            });
        }

        await prisma.forecast.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Forecast deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting forecast:', error);
        res.status(500).json({
            error: 'Failed to delete forecast',
            message: error.message
        });
    }
});

module.exports = router;
