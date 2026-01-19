const BonusCalculator = require('../../../core/bonus/engine/bonusCalculator');


describe('BonusCalculator', ()=> {

    test('throws error if category is missing', ()=>{
        expect(()=> new BonusCalculator({})).toThrow('category is required');


    });
    test('calculateBonus returns 0 for empty salesData', () => {
        const calculator = new BonusCalculator({category: 'steak'});
        expect(calculator.calculateBonus([])).toBe(0);
        expect(calculator.calculateBonus(null)).toBe(0);
        
    });


    test('calculateBonus returns 0 if tier is null', () => {
        const calculator = new BonusCalculator({ category: 'cocktail' });
        const salesData = [
            { quantity: 5, revenue: 500, tier: null },
            { quantity: 3, revenue: 150, tier: null }
        ];
        expect(calculator.calculateBonus(salesData)).toBe(0);
    });


    test('calculates bonus correctly for single sale', () => {
        const calculator = new BonusCalculator({ category: 'steak' });
        const salesData = [
            { quantity: 5, revenue: 500, tier: { minQuantity: 5, bonusPercentage: 0.10 } }
        ];
        expect(calculator.calculateBonus(salesData)).toBe(50); // 500 * 0.10
    });


    test('calculates bonus correctly for multiple sales', () => {
        const calculator = new BonusCalculator({ category: 'cocktail' });
        const salesData = [
            { quantity: 10, revenue: 1000, tier: { minQuantity: 5, bonusPercentage: 0.15 } }, // 150
            { quantity: 3, revenue: 300, tier: { minQuantity: 2, bonusPercentage: 0.05 } },   // 15
            { quantity: 1, revenue: 50, tier: null }                                       // 0
        ];
        expect(calculator.calculateBonus(salesData)).toBe(165);
    });

    test('ignores sales with invalid bonusPercentage', () => {
        const calculator = new BonusCalculator({ category: 'dessert' });
        const salesData = [
            { quantity: 5, revenue: 200, tier: { minQuantity: 5 } }, // no bonusPercentage
            { quantity: 3, revenue: 150, tier: { minQuantity: 2, bonusPercentage: 0.10 } }
        ];
        expect(calculator.calculateBonus(salesData)).toBe(15); // only second one counts
    });
    
    test('calculates correctly with bonusPercentage 0', () => {
        const calculator = new BonusCalculator({ category: 'dessert' });
        const salesData = [
            { quantity: 5, revenue: 200, tier: { minQuantity: 5, bonusPercentage: 0 } }
        ];
        expect(calculator.calculateBonus(salesData)).toBe(0);
    });

});