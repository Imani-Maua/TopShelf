/**
 * Validates query parameters for filtering receipts
 * Receipts are READ-ONLY - they come from CSV uploads
 */
const validateQueryParams = (req, res, next) => {
    const { participantId, productId, categoryId, startDate, endDate, minPrice, maxPrice } = req.query;
    const errors = [];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    // Validate ObjectIds if provided
    if (participantId && !objectIdPattern.test(participantId)) {
        errors.push('participantId must be a valid ObjectId');
    }
    if (productId && !objectIdPattern.test(productId)) {
        errors.push('productId must be a valid ObjectId');
    }
    if (categoryId && !objectIdPattern.test(categoryId)) {
        errors.push('categoryId must be a valid ObjectId');
    }

    // Validate dates if provided
    if (startDate) {
        const parsed = new Date(startDate);
        if (isNaN(parsed.getTime())) {
            errors.push('startDate must be a valid ISO 8601 date string');
        }
    }
    if (endDate) {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) {
            errors.push('endDate must be a valid ISO 8601 date string');
        }
    }

    // Validate prices if provided
    if (minPrice !== undefined) {
        const price = parseFloat(minPrice);
        if (isNaN(price) || price < 0) {
            errors.push('minPrice must be a non-negative number');
        }
    }
    if (maxPrice !== undefined) {
        const price = parseFloat(maxPrice);
        if (isNaN(price) || price < 0) {
            errors.push('maxPrice must be a non-negative number');
        }
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
    validateQueryParams
};
