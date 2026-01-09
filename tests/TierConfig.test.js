const TierConfig = require('../domain/TierConfig');


describe('TierConfig', ()=>{

    test('should throw if tiers is an empty array', ()=>{
       expect(() => {
        new TierConfig([])
       }).toThrow('tiers must be a non-empty array');
    });

    test('should throw if minQuantity and/or percentage is not a number',()=>{
        expect(()=> {
            new TierConfig([
                {minQuantity: '10', percentage: 0.05},
                 {minQuantity: 21, percentage: 0.1}
            ])
        }).toThrow('Invalid tier format');
    
        expect(()=>{
            new TierConfig([
                {minQuantity: 10, percentage: '0.05'},
                {minQuantity: 21, percentage: 0.1}
            ])
        }).toThrow('Invalid tier format');
    });

    test('should throw if percentage is out of bounds', ()=>{
        expect(()=>{
            new TierConfig([{minQuantity: 10, percentage: 2}])
        }).toThrow('percentage must be between 0 and 1');

        expect(()=>{
            new TierConfig([{minQuantity: 10, percentage: -1}])
        }).toThrow('percentage must be between 0 and 1');
    })


    test('getApplicableTier should return the correct tier', ()=>{
        const tierConfig = new TierConfig([
        { minQuantity: 31, percentage: 0.15 },
        { minQuantity: 10, percentage: 0.05 },
        { minQuantity: 21, percentage: 0.10 }
        ]);

        const tier = tierConfig.getApplicableTier(25);
        expect(tier).toEqual({ minQuantity: 21, percentage: 0.10 });
        
    });
}

)