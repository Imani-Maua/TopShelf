const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateCategory, validateObjectId } = require('./validators');

const prisma = new PrismaClient();

/**
 * GET /api/categories
 * Get all categories with their tier rules
 */
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                tierRules: {
                    orderBy: { minQuantity: 'asc' }
                },
                products: true
            },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: categories,
            count: categories.length
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

/**
 * GET /api/categories/:id
 * Get a specific category
 */
router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                tierRules: {
                    orderBy: { minQuantity: 'asc' }
                },
                products: true
            }
        });

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            error: 'Failed to fetch category',
            message: error.message
        });
    }
});

/**
 * POST /api/categories
 * Create a new category with tier rules
 */
router.post('/', validateCategory, async (req, res) => {
    try {
        const { name, mode, tierRules } = req.body;

        // Check for duplicate name (case-insensitive)
        const existing = await prisma.category.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Category already exists',
                details: ['A category with this name already exists']
            });
        }

        // Create category with tier rules
        const category = await prisma.category.create({
            data: {
                name,
                mode,
                tierRules: {
                    create: tierRules
                }
            },
            include: {
                tierRules: {
                    orderBy: { minQuantity: 'asc' }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            error: 'Failed to create category',
            message: error.message
        });
    }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put('/:id', validateObjectId, validateCategory, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, mode, tierRules } = req.body;

        // Check if exists
        const existing = await prisma.category.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        // Delete old tier rules and create new ones
        await prisma.tierRule.deleteMany({
            where: { categoryId: id }
        });

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                mode,
                tierRules: {
                    create: tierRules
                }
            },
            include: {
                tierRules: {
                    orderBy: { minQuantity: 'asc' }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            error: 'Failed to update category',
            message: error.message
        });
    }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exists
        const existing = await prisma.category.findUnique({
            where: { id },
            include: {
                products: true
            }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        // Check if has products
        if (existing.products.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete category',
                details: ['Category has associated products']
            });
        }

        // Delete tier rules first
        await prisma.tierRule.deleteMany({
            where: { categoryId: id }
        });

        // Delete category
        await prisma.category.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            error: 'Failed to delete category',
            message: error.message
        });
    }
});

module.exports = router;
