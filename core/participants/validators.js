/**
 * Validates participant creation/update
 */
const validateParticipant = (req, res, next) => {
    const { firstname, lastname } = req.body;
    const errors = [];

    // Check required fields
    if (!firstname || typeof firstname !== 'string' || firstname.trim() === '') {
        errors.push('firstname is required and must be a non-empty string');
    }
    if (!lastname || typeof lastname !== 'string' || lastname.trim() === '') {
        errors.push('lastname is required and must be a non-empty string');
    }

    // Validate length
    if (firstname && firstname.length > 100) {
        errors.push('firstname must not exceed 100 characters');
    }
    if (lastname && lastname.length > 100) {
        errors.push('lastname must not exceed 100 characters');
    }

    // Validate format (only letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (firstname && !namePattern.test(firstname)) {
        errors.push('firstname contains invalid characters');
    }
    if (lastname && !namePattern.test(lastname)) {
        errors.push('lastname contains invalid characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    // Trim whitespace
    req.body.firstname = firstname.trim();
    req.body.lastname = lastname.trim();

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
    validateParticipant,
    validateObjectId
};
