const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validateQueryParams } = require('./validators');

const prisma = new PrismaClient();

/**
 * GET /api/receipts
 * Get all receipts with optional filtering (READ-ONLY)
 * 
 * Receipts are imported from CSV files and cannot be modified via API.
 * Use the /api/bonuses/upload-receipts endpoint to import new receipts.
 * 
 * Query Parameters:
 * - participantId: Filter by participant (seller)
 * - productId: Filter by product
 * - categoryId: Filter by category
 * - startDate: Filter by date >= startDate (ISO 8601)
 * - endDate: Filter by date <= endDate (ISO 8601)
 * - minPrice: Filter by price >= minPrice
 * - maxPrice: Filter by price <= maxPrice
 * - limit: Limit number of results (default: 100, max: 1000)
 * - offset: Skip number of results (for pagination)
 * - sortBy: Sort field (date, price) (default: date)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 */
router.get('/', validateQueryParams, async (req, res) => {
    try {
        const {
            participantId,
            productId,
            categoryId,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            limit = 100,
            offset = 0,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build where clause
        const where = {};

        if (participantId) {
            where.participantId = participantId;
        }

        if (productId) {
            where.productId = productId;
        }

        if (categoryId) {
            where.product = {
                categoryId: categoryId
            };
        }

        // Date range filter
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = new Date(startDate);
            }
            if (endDate) {
                where.date.lte = new Date(endDate);
            }
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) {
                where.price.gte = parseFloat(minPrice);
            }
            if (maxPrice !== undefined) {
                where.price.lte = parseFloat(maxPrice);
            }
        }

        // Validate and sanitize limit
        const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
        const parsedOffset = parseInt(offset) || 0;

        // Validate sort parameters
        const validSortFields = ['date', 'price'];
        const validSortOrders = ['asc', 'desc'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'date';
        const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

        // Get receipts with filters
        const [receipts, totalCount] = await Promise.all([
            prisma.receipt.findMany({
                where,
                include: {
                    participant: {
                        select: {
                            id: true,
                            firstname: true,
                            lastname: true
                        }
                    },
                    product: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    mode: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    [finalSortBy]: finalSortOrder
                },
                take: parsedLimit,
                skip: parsedOffset
            }),
            prisma.receipt.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: receipts,
            pagination: {
                total: totalCount,
                limit: parsedLimit,
                offset: parsedOffset,
                hasMore: parsedOffset + receipts.length < totalCount
            },
            filters: {
                participantId,
                productId,
                categoryId,
                startDate,
                endDate,
                minPrice,
                maxPrice
            }
        });

    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({
            error: 'Failed to fetch receipts',
            message: error.message
        });
    }
});

/**
 * GET /api/receipts/:id
 * Get a specific receipt (READ-ONLY)
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(id)) {
            return res.status(400).json({
                error: 'Validation failed',
                details: ['Invalid ID format']
            });
        }

        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                participant: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                product: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                mode: true
                            }
                        }
                    }
                }
            }
        });

        if (!receipt) {
            return res.status(404).json({
                error: 'Receipt not found'
            });
        }

        res.status(200).json({
            success: true,
            data: receipt
        });

    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({
            error: 'Failed to fetch receipt',
            message: error.message
        });
    }
});

/**
 * GET /api/receipts/stats/summary
 * Get receipt statistics (READ-ONLY)
 * 
 * Query Parameters:
 * - startDate: Filter by date >= startDate
 * - endDate: Filter by date <= endDate
 * - participantId: Filter by participant
 * - categoryId: Filter by category
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate, participantId, categoryId } = req.query;

        // Build where clause
        const where = {};

        if (participantId) {
            where.participantId = participantId;
        }

        if (categoryId) {
            where.product = {
                categoryId: categoryId
            };
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = new Date(startDate);
            }
            if (endDate) {
                where.date.lte = new Date(endDate);
            }
        }

        const [totalReceipts, totalRevenue, avgPrice] = await Promise.all([
            prisma.receipt.count({ where }),
            prisma.receipt.aggregate({
                where,
                _sum: {
                    price: true
                }
            }),
            prisma.receipt.aggregate({
                where,
                _avg: {
                    price: true
                }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalReceipts,
                totalRevenue: totalRevenue._sum.price || 0,
                averagePrice: avgPrice._avg.price || 0
            }
        });

    } catch (error) {
        console.error('Error fetching receipt stats:', error);
        res.status(500).json({
            error: 'Failed to fetch receipt statistics',
            message: error.message
        });
    }
});

module.exports = router;
