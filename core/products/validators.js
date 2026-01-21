/**
 * Validates product creation/update
 */
const validateProduct = (req, res, next) => {
    const { name, price, categoryId } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }
    if (name && name.length > 200) {
        errors.push('name must not exceed 200 characters');
    }

    // Validate price
    if (price === undefined || price === null) {
        errors.push('price is required');
    }
    if (typeof price !== 'number' || price < 0) {
        errors.push('price must be a non-negative number');
    }
    if (typeof price === 'number' && price > 1000000) {
        errors.push('price must not exceed 1,000,000');
    }

    // Validate categoryId
    if (!categoryId || typeof categoryId !== 'string') {
        errors.push('categoryId is required and must be a string');
    }
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (categoryId && !objectIdPattern.test(categoryId)) {
        errors.push('categoryId must be a valid ObjectId');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    // Trim name
    if (name) {
        req.body.name = name.trim();
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

module.exports = {
    validateProduct,
    validateObjectId
};
