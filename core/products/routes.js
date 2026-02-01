const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateProduct, validateObjectId } = require('./validators');

const prisma = new PrismaClient();

/**
 * GET /api/products
 * Get all products
 * Query params: ?categoryId=xxx (optional filter)
 */
router.get('/', async (req, res) => {
    try {
        const { categoryId } = req.query;

        const where = categoryId ? { categoryId } : {};

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true
            },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

/**
 * GET /api/products/:id
 * Get a specific product
 */
router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    include: {
                        tierRules: true
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            error: 'Failed to fetch product',
            message: error.message
        });
    }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', validateProduct, async (req, res) => {
    try {
        const { name, price, categoryId } = req.body;

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

        // Check for duplicate name (case-insensitive)
        const existing = await prisma.product.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Product already exists',
                details: ['A product with this name already exists']
            });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price,
                categoryId
            },
            include: {
                category: true
            }
        });

        res.status(201).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            error: 'Failed to create product',
            message: error.message
        });
    }
});

/**
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id', validateObjectId, validateProduct, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, categoryId } = req.body;

        // Check if product exists
        const existing = await prisma.product.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

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

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                price,
                categoryId
            },
            include: {
                category: true
            }
        });

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            error: 'Failed to update product',
            message: error.message
        });
    }
});

/**
 * DELETE /api/products/:id
 * Delete a product
 */
router.delete('/:id', validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exists
        const existing = await prisma.product.findUnique({
            where: { id },
            include: {
                receipts: true
            }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

        // Check if has receipts
        if (existing.receipts.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete product',
                details: ['Product has associated receipts']
            });
        }

        await prisma.product.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            error: 'Failed to delete product',
            message: error.message
        });
    }
});

module.exports = router;
