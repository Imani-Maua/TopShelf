/**
 * Validates forecast creation/update
 */
const validateForecast = (req, res, next) => {
    const { month, year, targetAmount, threshold } = req.body;
    const errors = [];

    // Validate month
    if (month === undefined || month === null) {
        errors.push('month is required');
    }
    if (typeof month !== 'number' || !Number.isInteger(month)) {
        errors.push('month must be an integer');
    }
    if (Number.isInteger(month) && (month < 1 || month > 12)) {
        errors.push('month must be between 1 and 12');
    }

    // Validate year
    if (year === undefined || year === null) {
        errors.push('year is required');
    }
    if (typeof year !== 'number' || !Number.isInteger(year)) {
        errors.push('year must be an integer');
    }
    if (Number.isInteger(year) && (year < 2000 || year > 2100)) {
        errors.push('year must be between 2000 and 2100');
    }

    // Validate targetAmount
    if (targetAmount === undefined || targetAmount === null) {
        errors.push('targetAmount is required');
    }
    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
        errors.push('targetAmount must be a positive number');
    }

    // Validate threshold
    if (threshold === undefined || threshold === null) {
        errors.push('threshold is required');
    }
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        errors.push('threshold must be a decimal between 0 and 1 (e.g., 0.9 for 90%)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();
};

/**
 * Validates MongoDB ObjectId format
 */
const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    if (!objectIdPattern.test(id)) {
        return res.status(400).json({
            error: 'Validation failed',
            details: ['Invalid ID format']
        });
    }

    next();
};

/**
 * Validates month/year params
 */
const validateMonthYear = (req, res, next) => {
    const { month, year } = req.params;
    const errors = [];

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        errors.push('month must be between 1 and 12');
    }
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        errors.push('year must be between 2000 and 2100');
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
    validateForecast,
    validateObjectId,
    validateMonthYear
};
