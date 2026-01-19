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
        mockCalculators.steak.calculateBonus.mockReturnValue(50);
        mockCalculators.cocktail.calculateBonus.mockReturnValue(20);

        const aggregatedSales = {
            Alice: {
                steak: [{ quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 0.10 } }],
                cocktail: [{ quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 0.10 } }]
            },
            Bob: {
                steak: [{ quantity: 2, revenue: 200, tier: { minQuantity: 4, bonusPercentage: 0.05 } }]
            }
        };

        const payouts = new BonusPayouts(mockCalculators);
        const result = payouts.calculateBonuses(aggregatedSales);

        expect(result).toEqual([
  {
    seller: 'Alice',
    totalBonus: 70,
    breakdown: [
      { category: 'steak', bonus: 50 },
      { category: 'cocktail', bonus: 20 }
    ]
  },
  {
    seller: 'Bob',
    totalBonus: 50,
    breakdown: [
      { category: 'steak', bonus: 50 }
    ]
  }
]);

    });

    test('ignores categories with zero bonus', () => {
        mockCalculators.steak.calculateBonus.mockReturnValue(0);
        mockCalculators.cocktail.calculateBonus.mockReturnValue(0);

        const aggregatedSales = {
            Alice: {
                steak: [{ quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 0.10 } }],
                cocktail: [{ quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 0.10 } }]
            }
        };

        const payouts = new BonusPayouts(mockCalculators);
        expect(payouts.calculateBonuses(aggregatedSales)).toEqual([]);
    });

    test('sorts payouts by totalBonus descending', () => {
        mockCalculators.steak.calculateBonus.mockReturnValueOnce(20).mockReturnValueOnce(50);
        mockCalculators.cocktail.calculateBonus.mockReturnValue(10);

        const aggregatedSales = {
            Alice: { steak: [{ quantity: 1, revenue: 100, tier: { minQuantity: 1, bonusPercentage: 20 } }] },
            Bob: { steak: [{ quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 10 } }], cocktail: [{ quantity: 1, revenue: 100, tier: { minQuantity: 1, bonusPercentage: 10 } }] }
        };

        const payouts = new BonusPayouts(mockCalculators);
        const result = payouts.calculateBonuses(aggregatedSales);

        expect(result[0].seller).toBe('Bob');   // Bob has higher totalBonus
        expect(result[1].seller).toBe('Alice'); // Alice lower
    });
});
