const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateProduct, validateObjectId } = require('./validators');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { requireOperations } = require('../auth/middleware/authenticate');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/', validateProduct, requireOperations, async (req, res) => {
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
router.put('/:id', validateObjectId, validateProduct, requireOperations, async (req, res) => {
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
router.delete('/:id', validateObjectId, requireOperations, async (req, res) => {
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

/**
 * POST /api/products/upload-csv
 * Bulk import products from CSV
 * CSV format: name,category,price
 * Auto-creates categories if they don't exist (with default PER_ITEM mode)
 */
router.post('/upload-csv', upload.single('file'), requireOperations, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                details: ['Please upload a CSV file']
            });
        }

        const results = [];
        const errors = [];
        const duplicates = [];
        const newCategories = [];

        // Parse CSV
        const stream = Readable.from(req.file.buffer.toString());

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    results.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Process each row
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNum = i + 2; // +2 because CSV is 1-indexed and has header

            // Validate required fields
            if (!row.name || !row.category || !row.price) {
                errors.push({
                    row: rowNum,
                    message: 'Missing required fields (name, category, price)'
                });
                continue;
            }

            // Validate price
            const price = parseFloat(row.price);
            if (isNaN(price) || price < 0) {
                errors.push({
                    row: rowNum,
                    message: `Invalid price: "${row.price}". Price must be a non-negative number.`
                });
                continue;
            }

            // Check for duplicate product name
            const existingProduct = await prisma.product.findFirst({
                where: {
                    name: { equals: row.name.trim(), mode: 'insensitive' }
                }
            });

            if (existingProduct) {
                duplicates.push({
                    row: rowNum,
                    name: row.name
                });
                continue;
            }

            // Find or create category
            let category = await prisma.category.findFirst({
                where: {
                    name: { equals: row.category.trim(), mode: 'insensitive' }
                }
            });

            if (!category) {
                // Auto-create category with default PER_ITEM mode
                category = await prisma.category.create({
                    data: {
                        name: row.category.trim(),
                        mode: 'PER_ITEM' // Default mode
                    }
                });
                newCategories.push(category.name);
            }

            // Create product with price from CSV
            try {
                await prisma.product.create({
                    data: {
                        name: row.name.trim(),
                        price: parseFloat(row.price),
                        categoryId: category.id
                    }
                });
            } catch (err) {
                errors.push({
                    row: rowNum,
                    message: err.message
                });
            }
        }

        const processed = results.length - errors.length - duplicates.length;

        res.status(200).json({
            success: true,
            data: {
                processed,
                total: results.length,
                duplicates: duplicates.length,
                errors: errors.length,
                newCategories: newCategories.length,
                duplicateDetails: duplicates,
                errorDetails: errors,
                newCategoryList: newCategories
            },
            message: newCategories.length > 0
                ? `Created ${newCategories.length} new categories. Remember to set tier rules for bonus calculations!`
                : null
        });

    } catch (error) {
        console.error('Error uploading CSV:', error);
        res.status(500).json({
            error: 'Failed to process CSV',
            message: error.message
        });
    }
});

module.exports = router;
