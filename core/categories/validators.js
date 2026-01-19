/**
 * Validates category creation/update
 */
const validateCategory = (req, res, next) => {
    const { name, mode, tierRules } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }
    if (name && name.length > 100) {
        errors.push('name must not exceed 100 characters');
    }

    // Validate mode
    const validModes = ['PER_ITEM', 'PER_CATEGORY'];
    if (!mode || !validModes.includes(mode)) {
        errors.push(`mode must be one of: ${validModes.join(', ')}`);
    }

    // Validate tierRules (required - category must have at least 1 tier)
    if (tierRules !== undefined) {
        if (!Array.isArray(tierRules)) {
            errors.push('tierRules must be an array');
        } else if (tierRules.length === 0) {
            errors.push('tierRules must contain at least one tier');
        } else {
            // Validate each tier
            tierRules.forEach((tier, index) => {
                // Validate minQuantity
                if (typeof tier.minQuantity !== 'number' || !Number.isInteger(tier.minQuantity) || tier.minQuantity < 0) {
                    errors.push(`tierRules[${index}].minQuantity must be a non-negative integer`);
                }

                // Validate bonusPercentage (whole number 1-100)
                if (typeof tier.bonusPercentage !== 'number' || !Number.isInteger(tier.bonusPercentage)) {
                    errors.push(`tierRules[${index}].bonusPercentage must be a whole number`);
                }
                if (Number.isInteger(tier.bonusPercentage) && (tier.bonusPercentage < 1 || tier.bonusPercentage > 100)) {
                    errors.push(`tierRules[${index}].bonusPercentage must be between 1 and 100`);
                }
            });

            // Check for duplicate minQuantity values
            const quantities = tierRules.map(t => t.minQuantity);
            const duplicateQty = quantities.filter((q, i) => quantities.indexOf(q) !== i);
            if (duplicateQty.length > 0) {
                errors.push('tierRules cannot have duplicate minQuantity values');
            }

            // Check for duplicate bonusPercentage values
            const bonuses = tierRules.map(t => t.bonusPercentage);
            const duplicateBonus = bonuses.filter((b, i) => bonuses.indexOf(b) !== i);
            if (duplicateBonus.length > 0) {
                errors.push(`tierRules cannot have duplicate bonusPercentage values: ${duplicateBonus.join('%, ')}%`);
            }

            // Check strictly increasing bonuses
            const sorted = [...tierRules].sort((a, b) => a.minQuantity - b.minQuantity);
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].bonusPercentage <= sorted[i - 1].bonusPercentage) {
                    errors.push(
                        `Bonus must strictly increase. Tier at minQuantity ${sorted[i].minQuantity} ` +
                        `has bonus ${sorted[i].bonusPercentage}% which is not greater than ` +
                        `previous tier's bonus ${sorted[i - 1].bonusPercentage}%`
                    );
                    break; // Only report first violation
                }
            }
        }
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
    validateCategory,
    validateObjectId
};
