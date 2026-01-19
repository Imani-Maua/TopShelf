const BonusPayouts = require('../../../core/bonus/engine/bonusPayouts');


describe('BonusPayouts', () => {
    let mockCalculators;

    beforeEach(() => {
        // Mock calculators per category
        mockCalculators = {
            steak: { calculateBonus: jest.fn() },
            cocktail: { calculateBonus: jest.fn() }
        };
    });

    test('returns empty array if aggregatedSales is empty', () => {
        const payouts = new BonusPayouts(mockCalculators);
        expect(payouts.calculateBonuses({})).toEqual([]);
    });

    test('skips categories without calculators', () => {
        const aggregatedSales = {
            Alice: {
                dessert: [{ quantity: 5, revenue: 100, tier: { minQuantity: 5, bonusPercentage: 10 } }]
            }
        };
        const payouts = new BonusPayouts(mockCalculators);
        expect(payouts.calculateBonuses(aggregatedSales)).toEqual([]);
    });

    test('calculates total bonus and breakdown correctly', () => {
        // Setup mock return values
        mockCalculators.steak.calculateBonus.mockReturnValue({
            totalBonus: 50,
            items: [{ productName: 'Ribeye', quantity: 5, revenue: 500, bonus: 50, qualified: true }]
        });
        mockCalculators.cocktail.calculateBonus.mockReturnValue({
            totalBonus: 20,
            items: [{ productName: null, quantity: 3, revenue: 150, bonus: 20, qualified: true }]
        });

        const aggregatedSales = {
            Alice: {
                steak: [{ productName: 'Ribeye', quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 10 } }],
                cocktail: [{ productName: null, quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 10 } }]
            },
            Bob: {
                steak: [{ productName: 'Wagyu', quantity: 2, revenue: 200, tier: { minQuantity: 4, bonusPercentage: 5 } }]
            }
        };

        const payouts = new BonusPayouts(mockCalculators);
        const result = payouts.calculateBonuses(aggregatedSales);

        expect(result).toEqual([
            {
                seller: 'Alice',
                totalBonus: 70,
                breakdown: [
                    { category: 'steak', bonus: 50, items: expect.any(Array) },
                    { category: 'cocktail', bonus: 20, items: expect.any(Array) }
                ]
            },
            {
                seller: 'Bob',
                totalBonus: 50,
                breakdown: [
                    { category: 'steak', bonus: 50, items: expect.any(Array) }
                ]
            }
        ]);

    });

    test('ignores categories with zero bonus', () => {
        mockCalculators.steak.calculateBonus.mockReturnValue({ totalBonus: 0, items: [] });
        mockCalculators.cocktail.calculateBonus.mockReturnValue({ totalBonus: 0, items: [] });

        const aggregatedSales = {
            Alice: {
                steak: [{ productName: 'Ribeye', quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 10 } }],
                cocktail: [{ productName: null, quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 10 } }]
            }
        };

        const payouts = new BonusPayouts(mockCalculators);
        expect(payouts.calculateBonuses(aggregatedSales)).toEqual([]);
    });

    test('sorts payouts by totalBonus descending', () => {
        mockCalculators.steak.calculateBonus
            .mockReturnValueOnce({ totalBonus: 20, items: [] })
            .mockReturnValueOnce({ totalBonus: 50, items: [] });
        mockCalculators.cocktail.calculateBonus.mockReturnValue({ totalBonus: 10, items: [] });

        const aggregatedSales = {
            Alice: { steak: [{ productName: 'Ribeye', quantity: 1, revenue: 100, tier: { minQuantity: 1, bonusPercentage: 20 } }] },
            Bob: {
                steak: [{ productName: 'Wagyu', quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 10 } }],
                cocktail: [{ productName: null, quantity: 1, revenue: 100, tier: { minQuantity: 1, bonusPercentage: 10 } }]
            }
        };

        const payouts = new BonusPayouts(mockCalculators);
        const result = payouts.calculateBonuses(aggregatedSales);

        expect(result[0].seller).toBe('Bob');   // Bob has higher totalBonus
        expect(result[1].seller).toBe('Alice'); // Alice lower
    });
});
