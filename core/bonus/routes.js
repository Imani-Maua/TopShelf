const express = require('express');
const bonus = express.Router();
const BonusService = require('./services/bonusService');
const ParsingService = require('./services/parsingService');
const { validateBonusCalculation, validateReceiptUpload } = require('./validators');

const bonusService = new BonusService();
const parsingService = new ParsingService();

/**
 * GET /api/bonuses
 * Get all bonus payouts
 */
bonus.get('/', async (req, res) => {
    try {
        const payouts = await bonusService.getAllPayouts();
        res.status(200).json({
            success: true,
            data: payouts,
            count: payouts.length
        });
    } catch (error) {
        console.error('Error fetching payouts:', error);
        res.status(500).json({
            error: 'Failed to fetch payouts',
            message: error.message
        });
    }
});

/**
 * POST /api/bonuses/calculate
 * Calculate bonuses for a specific month/year
 * 
 * Body: { month: number, year: number, totalRevenue: number }
 */
bonus.post('/calculate', validateBonusCalculation, async (req, res) => {
    try {
        const { month, year, totalRevenue } = req.body;

        const result = await bonusService.calculateAllBonuses(month, year, totalRevenue);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error calculating bonuses:', error);

        if (error.message.includes('Forecast not found')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Failed to calculate bonuses',
            message: error.message
        });
    }
});

/**
 * GET /api/bonuses/participants/:id
 * Get payout history for a specific participant
 */
bonus.get('/participants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const payouts = await bonusService.getParticipantPayouts(id);
        res.status(200).json({
            success: true,
            data: payouts,
            count: payouts.length
        });
    } catch (error) {
        console.error('Error fetching participant payouts:', error);
        res.status(500).json({
            error: 'Failed to fetch participant payouts',
            message: error.message
        });
    }
});

/**
 * POST /api/bonuses/upload-receipts
 * Upload CSV file with receipts
 */
bonus.post('/upload-receipts', async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({
                error: 'Validation failed',
                details: ['filePath is required']
            });
        }

        const result = await parsingService.uploadReceipts(filePath);

        res.status(200).json({
            success: true,
            data: {
                processed: result.processed,
                errors: result.errors
            }
        });

    } catch (error) {
        console.error('Error uploading receipts:', error);
        res.status(500).json({
            error: 'Failed to upload receipts',
            message: error.message
        });
    }
});

module.exports = bonus;