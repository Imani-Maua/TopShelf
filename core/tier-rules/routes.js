const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateTierRule, validateTierRuleUpdate, validateObjectId, validateCategoryId } = require('./validators');

const prisma = new PrismaClient();

/**
 * Helper function to validate tier rules don't conflict
 * Checks for duplicate minQuantity, duplicate bonusPercentage, and strictly increasing bonuses
 */
async function validateTierRulesLogic(categoryId, newTierRule, excludeTierId = null) {
    const errors = [];

    // Get all existing tier rules for this category (excluding the one being edited)
    const existingTiers = await prisma.tierRule.findMany({
        where: {
            categoryId,
            ...(excludeTierId && { id: { not: excludeTierId } })
        }
    });

    // Combine existing + new tier
    const allTiers = [...existingTiers, newTierRule];

    // Check for duplicate minQuantity
    const quantities = allTiers.map(t => t.minQuantity);
    const duplicateQty = quantities.filter((q, i) => quantities.indexOf(q) !== i);
    if (duplicateQty.length > 0) {
        errors.push(`Duplicate minQuantity value: ${duplicateQty[0]}. Each tier must have a unique threshold.`);
    }

    // Check for duplicate bonusPercentage
    const bonuses = allTiers.map(t => t.bonusPercentage);
    const duplicateBonus = bonuses.filter((b, i) => bonuses.indexOf(b) !== i);
    if (duplicateBonus.length > 0) {
        errors.push(`Duplicate bonusPercentage value: ${duplicateBonus[0]}%. Each tier must have a unique bonus.`);
    }

    // Check strictly increasing bonuses
    const sorted = [...allTiers].sort((a, b) => a.minQuantity - b.minQuantity);
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

    return errors;
}

/**
 * GET /api/tier-rules
 * Get all tier rules across all categories
 */
router.get('/', async (req, res) => {
    try {
        const tierRules = await prisma.tierRule.findMany({
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        mode: true
                    }
                }
            },
            orderBy: [
                { categoryId: 'asc' },
                { minQuantity: 'asc' }
            ]
        });

        // Format response
        const formattedData = tierRules.map(tier => ({
            id: tier.id,
            categoryId: tier.categoryId,
            categoryName: tier.category.name,
            categoryMode: tier.category.mode,
            minQuantity: tier.minQuantity,
            bonusPercentage: tier.bonusPercentage
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            count: formattedData.length
        });

    } catch (error) {
        console.error('Error fetching tier rules:', error);
        res.status(500).json({
            error: 'Failed to fetch tier rules',
            message: error.message
        });
    }
});

/**
 * GET /api/tier-rules/category/:categoryId
 * Get tier rules for a specific category
 */
router.get('/category/:categoryId', validateCategoryId, async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        // Get tier rules
        const tierRules = await prisma.tierRule.findMany({
            where: { categoryId },
            orderBy: { minQuantity: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category.id,
                    name: category.name,
                    mode: category.mode
                },
                tierRules
            }
        });

    } catch (error) {
        console.error('Error fetching tier rules for category:', error);
        res.status(500).json({
            error: 'Failed to fetch tier rules',
            message: error.message
        });
    }
});

/**
 * POST /api/tier-rules
 * Create a new tier rule
 */
router.post('/', validateTierRule, async (req, res) => {
    try {
        const { categoryId, minQuantity, bonusPercentage } = req.body;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({
                error: 'Category not found',
                details: ['The specified category does not exist']
            });
        }

        // Validate tier rules logic
        const validationErrors = await validateTierRulesLogic(
            categoryId,
            { minQuantity, bonusPercentage }
        );

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Create tier rule
        const tierRule = await prisma.tierRule.create({
            data: {
                categoryId,
                minQuantity,
                bonusPercentage
            }
        });

        res.status(201).json({
            success: true,
            data: tierRule
        });

    } catch (error) {
        console.error('Error creating tier rule:', error);
        res.status(500).json({
            error: 'Failed to create tier rule',
            message: error.message
        });
    }
});

/**
 * PUT /api/tier-rules/:id
 * Update a tier rule
 */
router.put('/:id', validateObjectId, validateTierRuleUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        const { minQuantity, bonusPercentage } = req.body;

        // Check if tier rule exists
        const existingTier = await prisma.tierRule.findUnique({
            where: { id }
        });

        if (!existingTier) {
            return res.status(404).json({
                error: 'Tier rule not found'
            });
        }

        // Validate tier rules logic (excluding current tier)
        const validationErrors = await validateTierRulesLogic(
            existingTier.categoryId,
            { minQuantity, bonusPercentage },
            id
        );

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Update tier rule
        const tierRule = await prisma.tierRule.update({
            where: { id },
            data: {
                minQuantity,
                bonusPercentage
            }
        });

        res.status(200).json({
            success: true,
            data: tierRule
        });

    } catch (error) {
        console.error('Error updating tier rule:', error);
        res.status(500).json({
            error: 'Failed to update tier rule',
            message: error.message
        });
    }
});

/**
 * DELETE /api/tier-rules/:id
 * Delete a tier rule
 */
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if tier rule exists
        const existingTier = await prisma.tierRule.findUnique({
            where: { id }
        });

        if (!existingTier) {
            return res.status(404).json({
                error: 'Tier rule not found'
            });
        }

        // Check if category will still have at least 1 tier rule
        const tierCount = await prisma.tierRule.count({
            where: { categoryId: existingTier.categoryId }
        });

        if (tierCount <= 1) {
            return res.status(409).json({
                error: 'Cannot delete tier rule',
                details: ['Category must have at least one tier rule. Delete the category instead if you want to remove all tiers.']
            });
        }

        // Delete tier rule
        await prisma.tierRule.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Tier rule deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting tier rule:', error);
        res.status(500).json({
            error: 'Failed to delete tier rule',
            message: error.message
        });
    }
});

module.exports = router;
