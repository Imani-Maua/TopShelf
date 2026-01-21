const BonusCalculator = require('../../../core/bonus/engine/bonusCalculator');


describe('BonusCalculator', () => {

    test('throws error if category is missing', () => {
        expect(() => new BonusCalculator({})).toThrow('category is required');


    });
    test('calculateBonus returns empty result for empty salesData', () => {
        const calculator = new BonusCalculator({ category: 'steak' });
        expect(calculator.calculateBonus([])).toEqual({ totalBonus: 0, items: [] });
        expect(calculator.calculateBonus(null)).toEqual({ totalBonus: 0, items: [] });

    });


    test('calculateBonus returns 0 if tier is null', () => {
        const calculator = new BonusCalculator({ category: 'cocktail' });
        const salesData = [
            { productName: 'Martini', quantity: 5, revenue: 500, tier: null },
            { productName: 'Negroni', quantity: 3, revenue: 150, tier: null }
        ];
        const result = calculator.calculateBonus(salesData);
        expect(result.totalBonus).toBe(0);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].qualified).toBe(false);
    });


    test('calculates bonus correctly for single sale', () => {
        const calculator = new BonusCalculator({ category: 'steak' });
        const salesData = [
            { productName: 'Ribeye', quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 10 } }
        ];
        const result = calculator.calculateBonus(salesData);
        expect(result.totalBonus).toBe(50); // 500 * 10 / 100
        expect(result.items).toHaveLength(1);
        expect(result.items[0].productName).toBe('Ribeye');
        expect(result.items[0].qualified).toBe(true);
        expect(result.items[0].bonus).toBe(50);
    });


    test('calculates bonus correctly for multiple sales', () => {
        const calculator = new BonusCalculator({ category: 'cocktail' });
        const salesData = [
            { productName: 'Martini', quantity: 10, revenue: 1000, tier: { minQuantity: 5, bonusPercentage: 15 } }, // 150
            { productName: 'Negroni', quantity: 3, revenue: 300, tier: { minQuantity: 2, bonusPercentage: 5 } },   // 15
            { productName: 'Old Fashioned', quantity: 1, revenue: 50, tier: null }                                       // 0
        ];
        const result = calculator.calculateBonus(salesData);
        expect(result.totalBonus).toBe(165);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].qualified).toBe(true);
        expect(result.items[1].qualified).toBe(true);
        expect(result.items[2].qualified).toBe(false);
    });

    test('ignores sales with invalid bonusPercentage', () => {
        const calculator = new BonusCalculator({ category: 'dessert' });
        const salesData = [
            { productName: 'Tiramisu', quantity: 5, revenue: 200, tier: { minQuantity: 5 } }, // no bonusPercentage
            { productName: 'Cheesecake', quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 10 } }
        ];
        const result = calculator.calculateBonus(salesData);
        expect(result.totalBonus).toBe(15); // only second one counts
        expect(result.items[0].qualified).toBe(false);
        expect(result.items[1].qualified).toBe(true);
    });

    test('calculates correctly with bonusPercentage 0', () => {
        const calculator = new BonusCalculator({ category: 'dessert' });
        const salesData = [
            { productName: 'Sorbet', quantity: 5, revenue: 200, tier: { minQuantity: 5, bonusPercentage: 0 } }
        ];
        const result = calculator.calculateBonus(salesData);
        expect(result.totalBonus).toBe(0);
        expect(result.items[0].qualified).toBe(false);
    });

});