const express = require('express');
const multer = require('multer');
const fs = require('fs');
const bonus = express.Router();
const BonusService = require('./services/bonusService');
const ParsingService = require('./services/parsingService');
const { validateBonusCalculation } = require('./validators');

const bonusService = new BonusService();
const parsingService = new ParsingService();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
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
 * POST /api/bonuses/upload-receipts
 * Upload CSV file with receipts
 * 
 * Multipart form data:
 * - file: CSV file
 * - filterByMonth: boolean (optional)
 * - month: number (1-12, required if filterByMonth is true)
 * - year: number (required if filterByMonth is true)
 */
bonus.post('/upload-receipts', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Validation failed',
                details: ['CSV file is required']
            });
        }

        const filePath = req.file.path;
        const filterByMonth = req.body.filterByMonth === 'true';
        const month = filterByMonth ? parseInt(req.body.month) : null;
        const year = filterByMonth ? parseInt(req.body.year) : null;

        // Validate month/year if filtering
        if (filterByMonth) {
            if (!month || month < 1 || month > 12) {
                fs.unlinkSync(filePath); // Clean up uploaded file
                return res.status(400).json({
                    error: 'Validation failed',
                    details: ['Valid month (1-12) is required when filtering by month']
                });
            }
            if (!year || year < 2000) {
                fs.unlinkSync(filePath); // Clean up uploaded file
                return res.status(400).json({
                    error: 'Validation failed',
                    details: ['Valid year is required when filtering by month']
                });
            }
        }

        const result = await parsingService.uploadReceipts(
            filePath,
            filterByMonth ? { month, year } : null
        );

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            data: {
                processed: result.processed,
                errors: result.errors,
                monthBreakdown: result.monthBreakdown || {}
            }
        });

    } catch (error) {
        console.error('Error uploading receipts:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Failed to upload receipts',
            message: error.message
        });
    }
});

module.exports = bonus;