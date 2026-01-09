const BonusRule = require('../domain/rules/BonusRules');

class TestRule extends BonusRule{
    calculateBonus(_){
        return 0;
    }
}

describe('BonusRule', ()=> {
    test('should throw if no category is provided', () => {
        expect(()=> new TestRule({tiers: [{minQuantity: 10, percentage: 0.05}]}))
        .toThrow('BonusRule requires a category!');
    })


    test('should throw if tiers are missing', ()=>{
        expect(() => new TestRule({category: 'test'}))
        .toThrow('tiers must be a non-empty array');
    })
    test('should throw of tiers have an invalid format', ()=>{
        expect(() => new TestRule({
            category: 'test',
            tiers: [{minQuantity: '10', percentage: 0.05}]
        })).toThrow('Invalid tier format');
    expect(()=> new TestRule({
        category: 'test',
        tiers: [{minQuantity: 10, percentage: 2}]
    })).toThrow('percentage must be between 0 and 1');

    })

    test('should sort tiers ascending by minQuantity', ()=>{
        const rule = new TestRule({
            category: 'test',
            tiers:[
                { minQuantity: 20, percentage: 0.1 },
                { minQuantity: 10, percentage: 0.05 },
                { minQuantity: 30, percentage: 0.15 }
            ]
        });

        const sortedMinQuantities = rule.tiers.map(tier => tier.minQuantity);
        expect(sortedMinQuantities).toEqual([10, 20, 30]);
    });

    test('getApplicableTier should return correct tier', ()=>{
        const rule = new TestRule({
            category: 'test', 
            tiers: [
                { minQuantity: 10, percentage: 0.05 },
                { minQuantity: 20, percentage: 0.1 },
                { minQuantity: 30, percentage: 0.15 }
            ]
        });

        expect(rule.getApplicableTier(5)).toBeNull;
        expect(rule.getApplicableTier(10).percentage).toBe(0.05);
        expect(rule.getApplicableTier(15).percentage).toBe(0.05);
        expect(rule.getApplicableTier(25).percentage).toBe(0.1);
        expect(rule.getApplicableTier(35).percentage).toBe(0.15);
    });

    test('calculateBonus should throw if not overridden', () => {
        class BadRule extends BonusRule{}
        expect(()=> new BadRule({
            category: 'bad rule',
            tiers: [{minQuantity: 10, percentage: 0.05}]
        }).calculateBonus()).toThrow(/must be implemented/);
    });
   
});