const BonusCalculator = require('../domain/BonusCalculator');
const TierConfig = require('../domain/TierConfig')


describe('BonusCalculator', ()=> {

    test('should return 0 if no salesData is provided', ()=>{
        const tierConfig = new TierConfig([
        {minQuantity: 10, percentage: 0.05}, 
        {minQuantity: 21, percentage: 0.1},
        {minQuantity: 31, percentage: 0.15}
       ]);

       const calculator = new BonusCalculator({
        category: 'steaks',
        tierConfig,
        mode: 'PER ITEM'
       });

       const salesData = {};

       const bonus1 = calculator.calculateBonus(salesData);
       const bonus2 = calculator.calculateBonus();

       expect(bonus1).toBe(0);
       expect(bonus2).toBe(0);


    });
    test('should throw if any argument is missing', () => {
        expect(()=>{
            new BonusCalculator({
                category: 'steak',
                tierConfig: {}
            })
        }).toThrow('mode is required');

        expect(()=>{
            new BonusCalculator({
                tierConfig: {},
                mode: 'PER ITEM'
            })
        }).toThrow('category is required');
        
        expect(()=>{
            new BonusCalculator({
                category: 'steak',
                mode: 'PER ITEM'
            })
        }).toThrow('tierConfig is required');
    });


    test("'PER ITEM' mode: items of the same category should be calculated differently ", ()=>{
       const tierConfig = new TierConfig([
        {minQuantity: 10, percentage: 0.05}, 
        {minQuantity: 21, percentage: 0.1},
        {minQuantity: 31, percentage: 0.15}
       ]);

       const calculator = new BonusCalculator({
        category: 'steaks',
        tierConfig,
        mode: 'PER ITEM'
       });

       const salesData = {
        ribeye: {quantity: 13, revenue: 1300},
        wagyu: {quantity: 2, revenue: 1700}
       };

       const bonus = calculator.calculateBonus(salesData);

       expect(bonus).toBe(65);

    });

    test("'PER CATEGORY' mode: items of the same category should be aggregated together", ()=>{
       const tierConfig = new TierConfig([
        {minQuantity: 20, percentage: 0.05},
        {minQuantity: 25, percentage: 0.08},
        {minQuantity: 30, percentage: 0.1}
       ]);

       const calculator = new BonusCalculator({
        category: 'cocktails',
        tierConfig,
        mode: 'PER CATEGORY'
       });

       const salesData = {
         quantity: 22, revenue: 144
       };

       const bonus = calculator.calculateBonus(salesData);

       expect(bonus).toBe(7.2);

    });

    test('should throw if an unsupported calculation mode is given', ()=>{
        const tierConfig = new TierConfig([
        {minQuantity: 200, percentage: 0.05}
       ]);

       const calculator = new BonusCalculator({
        category: 'cocktails',
        tierConfig,
        mode: 'PER STEAK'
       });

       expect(()=> {calculator.calculateBonus({})}).toThrow('Unsupported bonus calculation mode');

    });
 
});