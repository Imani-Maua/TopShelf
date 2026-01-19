/**
 * Validates bonus calculation request
 * Ensures month, year, and totalRevenue are valid
 */
const validateBonusCalculation = (req, res, next) => {
    const { month, year, totalRevenue } = req.body;
    const errors = [];

    // Check required fields
    if (month === undefined || month === null) {
        errors.push('month is required');
    }
    if (year === undefined || year === null) {
        errors.push('year is required');
    }
    if (totalRevenue === undefined || totalRevenue === null) {
        errors.push('totalRevenue is required');
    }

    // If required fields are missing, return early
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    // Validate types
    if (typeof month !== 'number' || !Number.isInteger(month)) {
        errors.push('month must be an integer');
    }
    if (typeof year !== 'number' || !Number.isInteger(year)) {
        errors.push('year must be an integer');
    }
    if (typeof totalRevenue !== 'number') {
        errors.push('totalRevenue must be a number');
    }

    // Validate ranges
    if (Number.isInteger(month) && (month < 1 || month > 12)) {
        errors.push('month must be between 1 and 12');
    }
    if (Number.isInteger(year) && (year < 2000)) {
        errors.push('year must be between 2000 and 2100');
    }
    if (typeof totalRevenue === 'number' && totalRevenue < 0) {
        errors.push('totalRevenue must be non-negative');
    }

    // If validation errors exist, return them
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    // Validation passed
    next();
};

/**
 * Validates file upload for receipts
 */
const validateReceiptUpload = (req, res, next) => {
    const errors = [];

    // Check if file exists
    if (!req.file) {
        errors.push('CSV file is required');
    }

    // Check file type
    if (req.file && !req.file.originalname.endsWith('.csv')) {
        errors.push('File must be a CSV file');
    }

    // Check file size (max 10MB)
    if (req.file && req.file.size > 10 * 1024 * 1024) {
        errors.push('File size must not exceed 10MB');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();
};

module.exports = {
    validateBonusCalculation,
    validateReceiptUpload
};