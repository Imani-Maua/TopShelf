jest.mock('@prisma/client', () => {
    const mPrisma = {
        forecast: { findFirst: jest.fn() },
        receipt: { findMany: jest.fn() },
        category: { findMany: jest.fn() },
        bonusPayout: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 0 })
        }
    };
    return {
        PrismaClient: jest.fn(() => mPrisma)
    };
});

jest.mock('../../../core/bonus/engine/forecastChecker');
jest.mock('../../../core/bonus/engine/bonusCalculator');
jest.mock('../../../core/bonus/engine/bonusPayouts');
jest.mock('../../../core/bonus/services/utils');

const BonusService = require('../../../core/bonus/services/bonusService');
const ForecastChecker = require('../../../core/bonus/engine/forecastChecker');
const BonusPayouts = require('../../../core/bonus/engine/bonusPayouts');
const { formatDataForCalculation } = require('../../../core/bonus/services/utils');
const { PrismaClient } = require('@prisma/client');

describe('BonusService.calculateAllBonuses', () => {
    let service;
    let prisma;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new BonusService();
        prisma = new PrismaClient();
    });

    test('throws if totalRevenue is missing or invalid', async () => {
        await expect(
            service.calculateAllBonuses(1, 2026, null)
        ).rejects.toThrow(/No total revenue provided/);
    });

    test('throws if no forecast exists', async () => {
        prisma.forecast.findFirst.mockResolvedValue(null);

        await expect(
            service.calculateAllBonuses(1, 2026, 10000)
        ).rejects.toThrow(/Forecast not found/);
    });

    test('returns early if forecast is not met', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 20000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => false
        }));

        const result = await service.calculateAllBonuses(1, 2026, 15000);

        expect(result).toEqual({
            forecastMet: false,
            revenues: { total: 15000, target: 20000 },
            payouts: []
        });
    });

    test('returns empty payouts if no receipts exist', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 10000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => true
        }));

        prisma.receipt.findMany.mockResolvedValue([]);

        const result = await service.calculateAllBonuses(1, 2026, 12000);

        expect(result).toEqual({
            message: 'No sales found for this period.',
            payouts: []
        });
    });

    test('calculates payouts and sorts them by amount', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 10000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => true
        }));

        prisma.receipt.findMany.mockResolvedValue([
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            },
            {
                participantId: 'p2',
                participant: { firstname: 'Bob', lastname: 'Jones' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            }
        ]);

        prisma.category.findMany.mockResolvedValue([
            {
                id: 'c1',
                name: 'steak',
                mode: 'quantity',
                tierRules: []
            }
        ]);

        formatDataForCalculation.mockReturnValue([
            { quantity: 5, revenue: 500 }
        ]);

        BonusPayouts.mockImplementation(() => ({
            calculateBonuses: () => ([
                {
                    seller: 'p1',
                    totalBonus: 200,
                    breakdown: [{ category: 'steak', bonus: 200 }]
                },
                {
                    seller: 'p2',
                    totalBonus: 100,
                    breakdown: [{ category: 'steak', bonus: 100 }]
                }
            ])
        }));

        const result = await service.calculateAllBonuses(1, 2026, 15000);

        expect(result.forecastMet).toBe(true);
        expect(result.payouts).toEqual([
            {
                participant: { id: 'p1', name: 'Alice Smith' },
                amount: 200,
                breakdown: [{ category: 'steak', bonus: 200 }]
            },
            {
                participant: { id: 'p2', name: 'Bob Jones' },
                amount: 100,
                breakdown: [{ category: 'steak', bonus: 100 }]
            }
        ]);
    });

    test('handles multiple receipts from same participant in same category', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 10000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => true
        }));

        // Multiple receipts from Alice in steak category
        prisma.receipt.findMany.mockResolvedValue([
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            },
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            }
        ]);

        prisma.category.findMany.mockResolvedValue([
            {
                id: 'c1',
                name: 'steak',
                mode: 'PER CATEGORY',
                tierRules: []
            }
        ]);

        formatDataForCalculation.mockReturnValue([
            { quantity: 1, revenue: 50 }
        ]);

        BonusPayouts.mockImplementation(() => ({
            calculateBonuses: () => ([
                {
                    seller: 'p1',
                    totalBonus: 100,
                    breakdown: [{ category: 'steak', bonus: 100 }]
                }
            ])
        }));

        const result = await service.calculateAllBonuses(1, 2026, 15000);

        expect(result.forecastMet).toBe(true);
        expect(result.payouts).toHaveLength(1);
        expect(result.payouts[0].participant.id).toBe('p1');
    });

    test('handles same participant selling in multiple categories', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 10000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => true
        }));

        // Alice sells both steaks and cocktails
        prisma.receipt.findMany.mockResolvedValue([
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            },
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c2',
                    category: { name: 'cocktail' }
                }
            }
        ]);

        prisma.category.findMany.mockResolvedValue([
            {
                id: 'c1',
                name: 'steak',
                mode: 'PER CATEGORY',
                tierRules: []
            },
            {
                id: 'c2',
                name: 'cocktail',
                mode: 'PER ITEM',
                tierRules: []
            }
        ]);

        formatDataForCalculation.mockReturnValue([
            { quantity: 1, revenue: 50 }
        ]);

        BonusPayouts.mockImplementation(() => ({
            calculateBonuses: () => ([
                {
                    seller: 'p1',
                    totalBonus: 150,
                    breakdown: [
                        { category: 'steak', bonus: 100 },
                        { category: 'cocktail', bonus: 50 }
                    ]
                }
            ])
        }));

        const result = await service.calculateAllBonuses(1, 2026, 15000);

        expect(result.forecastMet).toBe(true);
        expect(result.payouts).toHaveLength(1);
        expect(result.payouts[0].breakdown).toHaveLength(2);
    });

    test('handles formatDataForCalculation returning single object (not array)', async () => {
        prisma.forecast.findFirst.mockResolvedValue({
            threshold: 0.8,
            targetAmount: 10000
        });

        ForecastChecker.mockImplementation(() => ({
            isForecastMet: () => true
        }));

        prisma.receipt.findMany.mockResolvedValue([
            {
                participantId: 'p1',
                participant: { firstname: 'Alice', lastname: 'Smith' },
                product: {
                    categoryId: 'c1',
                    category: { name: 'steak' }
                }
            }
        ]);

        prisma.category.findMany.mockResolvedValue([
            {
                id: 'c1',
                name: 'steak',
                mode: 'PER CATEGORY',
                tierRules: []
            }
        ]);

        // Return single object instead of array (PER CATEGORY mode)
        formatDataForCalculation.mockReturnValue(
            { quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 0.10 } }
        );

        BonusPayouts.mockImplementation(() => ({
            calculateBonuses: () => ([
                {
                    seller: 'p1',
                    totalBonus: 50,
                    breakdown: [{ category: 'steak', bonus: 50 }]
                }
            ])
        }));

        const result = await service.calculateAllBonuses(1, 2026, 15000);

        expect(result.forecastMet).toBe(true);
        expect(result.payouts).toHaveLength(1);
    });
});

