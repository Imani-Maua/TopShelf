/**
 * Validates tier rule creation/update
 */
const validateTierRule = (req, res, next) => {
    const { categoryId, minQuantity, bonusPercentage } = req.body;
    const errors = [];

    // Validate categoryId
    if (!categoryId || typeof categoryId !== 'string') {
        errors.push('categoryId is required and must be a string');
    }
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (categoryId && !objectIdPattern.test(categoryId)) {
        errors.push('categoryId must be a valid ObjectId');
    }

    // Validate minQuantity
    if (minQuantity === undefined || minQuantity === null) {
        errors.push('minQuantity is required');
    }
    if (typeof minQuantity !== 'number' || !Number.isInteger(minQuantity)) {
        errors.push('minQuantity must be a whole number');
    }
    if (Number.isInteger(minQuantity) && minQuantity < 0) {
        errors.push('minQuantity must be >= 0');
    }

    // Validate bonusPercentage
    if (bonusPercentage === undefined || bonusPercentage === null) {
        errors.push('bonusPercentage is required');
    }
    if (typeof bonusPercentage !== 'number' || !Number.isInteger(bonusPercentage)) {
        errors.push('bonusPercentage must be a whole number');
    }
    if (Number.isInteger(bonusPercentage) && (bonusPercentage < 1 || bonusPercentage > 100)) {
        errors.push('bonusPercentage must be between 1 and 100');
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
 * Validates tier rule update (no categoryId needed)
 */
const validateTierRuleUpdate = (req, res, next) => {
    const { minQuantity, bonusPercentage } = req.body;
    const errors = [];

    // Validate minQuantity
    if (minQuantity === undefined || minQuantity === null) {
        errors.push('minQuantity is required');
    }
    if (typeof minQuantity !== 'number' || !Number.isInteger(minQuantity)) {
        errors.push('minQuantity must be a whole number');
    }
    if (Number.isInteger(minQuantity) && minQuantity < 0) {
        errors.push('minQuantity must be >= 0');
    }

    // Validate bonusPercentage
    if (bonusPercentage === undefined || bonusPercentage === null) {
        errors.push('bonusPercentage is required');
    }
    if (typeof bonusPercentage !== 'number' || !Number.isInteger(bonusPercentage)) {
        errors.push('bonusPercentage must be a whole number');
    }
    if (Number.isInteger(bonusPercentage) && (bonusPercentage < 1 || bonusPercentage > 100)) {
        errors.push('bonusPercentage must be between 1 and 100');
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
 * Validates category ObjectId in params
 */
const validateCategoryId = (req, res, next) => {
    const { categoryId } = req.params;
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    if (!objectIdPattern.test(categoryId)) {
        return res.status(400).json({
            error: 'Validation failed',
            details: ['Invalid category ID format']
        });
    }

    next();
};

module.exports = {
    validateTierRule,
    validateTierRuleUpdate,
    validateObjectId,
    validateCategoryId
};
