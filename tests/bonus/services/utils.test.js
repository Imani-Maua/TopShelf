/**
 * Test Suite for services/utils.js
 * 
 * This module contains utility functions for formatting receipt data
 * for bonus calculations based on different calculation modes.
 */

const { formatDataForCalculation, getApplicableTier } = require('../../../core/bonus/services/utils');

describe('services/utils', () => {

    describe('getApplicableTier', () => {

        test('returns null when no tiers are provided', () => {
            const result = getApplicableTier(5, []);
            expect(result).toBeNull();
        });

        test('returns null when quantity is below all tier minimums', () => {
            const tiers = [
                { minQuantity: 5, bonusPercentage: 0.10 },
                { minQuantity: 10, bonusPercentage: 0.15 },
                { minQuantity: 20, bonusPercentage: 0.20 }
            ];
            const result = getApplicableTier(3, tiers);
            expect(result).toBeNull();
        });

        test('returns the lowest tier when quantity exactly matches minimum', () => {
            const tiers = [
                { minQuantity: 5, bonusPercentage: 0.10 },
                { minQuantity: 10, bonusPercentage: 0.15 }
            ];
            const result = getApplicableTier(5, tiers);
            expect(result).toEqual({ minQuantity: 5, bonusPercentage: 0.10 });
        });

        test('returns the highest applicable tier when quantity qualifies for multiple tiers', () => {
            const tiers = [
                { minQuantity: 5, bonusPercentage: 0.10 },
                { minQuantity: 10, bonusPercentage: 0.15 },
                { minQuantity: 20, bonusPercentage: 0.20 }
            ];
            const result = getApplicableTier(25, tiers);
            expect(result).toEqual({ minQuantity: 20, bonusPercentage: 0.20 });
        });

        test('returns correct tier when quantity is between two tiers', () => {
            const tiers = [
                { minQuantity: 5, bonusPercentage: 0.10 },
                { minQuantity: 10, bonusPercentage: 0.15 },
                { minQuantity: 20, bonusPercentage: 0.20 }
            ];
            const result = getApplicableTier(15, tiers);
            expect(result).toEqual({ minQuantity: 10, bonusPercentage: 0.15 });
        });

        test('handles unsorted tiers correctly', () => {
            const tiers = [
                { minQuantity: 20, bonusPercentage: 0.20 },
                { minQuantity: 5, bonusPercentage: 0.10 },
                { minQuantity: 10, bonusPercentage: 0.15 }
            ];
            const result = getApplicableTier(12, tiers);
            expect(result).toEqual({ minQuantity: 10, bonusPercentage: 0.15 });
        });

        test('handles single tier', () => {
            const tiers = [
                { minQuantity: 5, bonusPercentage: 0.10 }
            ];
            const result = getApplicableTier(10, tiers);
            expect(result).toEqual({ minQuantity: 5, bonusPercentage: 0.10 });
        });

        test('returns null for zero quantity', () => {
            const tiers = [
                { minQuantity: 1, bonusPercentage: 0.10 }
            ];
            const result = getApplicableTier(0, tiers);
            expect(result).toBeNull();
        });

        test('handles tier with minQuantity of 0', () => {
            const tiers = [
                { minQuantity: 0, bonusPercentage: 0.05 },
                { minQuantity: 5, bonusPercentage: 0.10 }
            ];
            const result = getApplicableTier(3, tiers);
            expect(result).toEqual({ minQuantity: 0, bonusPercentage: 0.05 });
        });
    });

    describe('formatDataForCalculation', () => {

        describe('PER CATEGORY mode', () => {

            test('aggregates all receipts into single object with total quantity and revenue', () => {
                const receipts = [
                    { price: 50.00 },
                    { price: 75.50 },
                    { price: 30.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 },
                    { minQuantity: 5, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', tiers);

                expect(result).toEqual({
                    quantity: 3,
                    revenue: 155.50,
                    tier: { minQuantity: 2, bonusPercentage: 0.10 }
                });
            });

            test('returns correct tier based on receipt count', () => {
                const receipts = [
                    { price: 50.00 },
                    { price: 50.00 },
                    { price: 50.00 },
                    { price: 50.00 },
                    { price: 50.00 },
                    { price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 },
                    { minQuantity: 5, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', tiers);

                expect(result).toEqual({
                    quantity: 6,
                    revenue: 300.00,
                    tier: { minQuantity: 5, bonusPercentage: 0.15 }
                });
            });

            test('handles single receipt', () => {
                const receipts = [
                    { price: 100.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.05 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', tiers);

                expect(result).toEqual({
                    quantity: 1,
                    revenue: 100.00,
                    tier: { minQuantity: 1, bonusPercentage: 0.05 }
                });
            });

            test('returns null tier when no tier applies', () => {
                const receipts = [
                    { price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 5, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', tiers);

                expect(result).toEqual({
                    quantity: 1,
                    revenue: 50.00,
                    tier: null
                });
            });

            test('handles empty tiers array', () => {
                const receipts = [
                    { price: 50.00 },
                    { price: 50.00 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', []);

                expect(result).toEqual({
                    quantity: 2,
                    revenue: 100.00,
                    tier: null
                });
            });
        });

        describe('PER ITEM mode', () => {

            test('groups receipts by product name and calculates separate totals', () => {
                const receipts = [
                    { product: { name: 'Ribeye Steak' }, price: 50.00 },
                    { product: { name: 'Ribeye Steak' }, price: 55.00 },
                    { product: { name: 'Mojito' }, price: 12.00 },
                    { product: { name: 'Mojito' }, price: 12.00 },
                    { product: { name: 'Mojito' }, price: 12.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 },
                    { minQuantity: 3, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(2);
                expect(result).toEqual(
                    expect.arrayContaining([
                        {
                            quantity: 2,
                            revenue: 105.00,
                            tier: { minQuantity: 2, bonusPercentage: 0.10 }
                        },
                        {
                            quantity: 3,
                            revenue: 36.00,
                            tier: { minQuantity: 3, bonusPercentage: 0.15 }
                        }
                    ])
                );
            });

            test('handles single product with multiple receipts', () => {
                const receipts = [
                    { product: { name: 'Ribeye Steak' }, price: 50.00 },
                    { product: { name: 'Ribeye Steak' }, price: 50.00 },
                    { product: { name: 'Ribeye Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual({
                    quantity: 3,
                    revenue: 150.00,
                    tier: { minQuantity: 2, bonusPercentage: 0.10 }
                });
            });

            test('handles multiple products with single receipt each', () => {
                const receipts = [
                    { product: { name: 'Ribeye Steak' }, price: 50.00 },
                    { product: { name: 'Mojito' }, price: 12.00 },
                    { product: { name: 'Tiramisu' }, price: 8.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.05 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(3);
                expect(result).toEqual(
                    expect.arrayContaining([
                        { quantity: 1, revenue: 50.00, tier: { minQuantity: 1, bonusPercentage: 0.05 } },
                        { quantity: 1, revenue: 12.00, tier: { minQuantity: 1, bonusPercentage: 0.05 } },
                        { quantity: 1, revenue: 8.00, tier: { minQuantity: 1, bonusPercentage: 0.05 } }
                    ])
                );
            });

            test('assigns correct tier to each product based on its quantity', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 },
                    { product: { name: 'Steak' }, price: 50.00 },
                    { product: { name: 'Cocktail' }, price: 10.00 },
                    { product: { name: 'Cocktail' }, price: 10.00 },
                    { product: { name: 'Cocktail' }, price: 10.00 },
                    { product: { name: 'Cocktail' }, price: 10.00 },
                    { product: { name: 'Cocktail' }, price: 10.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 },
                    { minQuantity: 5, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(2);

                const steakResult = result.find(r => r.revenue === 100.00);
                const cocktailResult = result.find(r => r.revenue === 50.00);

                expect(steakResult).toEqual({
                    quantity: 2,
                    revenue: 100.00,
                    tier: { minQuantity: 2, bonusPercentage: 0.10 }
                });

                expect(cocktailResult).toEqual({
                    quantity: 5,
                    revenue: 50.00,
                    tier: { minQuantity: 5, bonusPercentage: 0.15 }
                });
            });

            test('assigns null tier when product quantity does not meet minimum', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 5, bonusPercentage: 0.15 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual({
                    quantity: 1,
                    revenue: 50.00,
                    tier: null
                });
            });

            test('returns empty array for empty receipts', () => {
                const result = formatDataForCalculation([], 'PER ITEM', []);
                expect(result).toEqual([]);
            });
        });

        describe('Invalid or unknown mode', () => {

            test('returns empty array for unknown mode', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, 'UNKNOWN_MODE', tiers);
                expect(result).toEqual([]);
            });

            test('returns empty array for null mode', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, null, tiers);
                expect(result).toEqual([]);
            });

            test('returns empty array for undefined mode', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, undefined, tiers);
                expect(result).toEqual([]);
            });

            test('returns empty array for empty string mode', () => {
                const receipts = [
                    { product: { name: 'Steak' }, price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 1, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, '', tiers);
                expect(result).toEqual([]);
            });
        });

        describe('Edge cases', () => {

            test('handles receipts with zero price in PER CATEGORY mode', () => {
                const receipts = [
                    { price: 0 },
                    { price: 50.00 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, 'PER CATEGORY', tiers);

                expect(result).toEqual({
                    quantity: 2,
                    revenue: 50.00,
                    tier: { minQuantity: 2, bonusPercentage: 0.10 }
                });
            });

            test('handles receipts with decimal prices in PER ITEM mode', () => {
                const receipts = [
                    { product: { name: 'Item' }, price: 10.99 },
                    { product: { name: 'Item' }, price: 10.99 }
                ];
                const tiers = [
                    { minQuantity: 2, bonusPercentage: 0.10 }
                ];

                const result = formatDataForCalculation(receipts, 'PER ITEM', tiers);

                expect(result).toHaveLength(1);
                expect(result[0].revenue).toBeCloseTo(21.98, 2);
            });
        });
    });
});
