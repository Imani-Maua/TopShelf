const BonusService = require('../../services/BonusService');

describe('BonusService integration', ()=>{
    test('calculates bonuses for multiple sellers across categories', ()=>{
        const service = new BonusService({
            upsellCatalog: {
                steak: ['wagyu'],
                cocktail: ['negroni', 'martini']
            },
            tierRules: {
                steak: [
                    {minQuantity: 2, percentage: 0.05},
                    {minQuantity: 5, percentage: 0.1},
                    {minQuantity: 7, percentage: 0.15}
                ],
                cocktail: [
                    {minQuantity: 2, percentage: 0.05},
                    {minQuantity: 5, percentage: 0.08},
                    {minQuantity: 7, percentage: 0.1}
                ]
            },
            modes: {
                steak: 'PER ITEM',
                cocktail: 'PER CATEGORY'
            },
            thresholdPercentage: 90,
            monthlyForecast: 500
        });

        service.addReceipt({seller: 'Alice', category: 'steak', item: 'wagyu', price: 100});
        service.addReceipt({seller: 'Alice', category: 'steak', item: 'wagyu', price: 100});
        service.addReceipt({seller: 'Alice', category:'cocktail', item: 'negroni', price: 10});
        service.addReceipt({seller: 'Alice', category: 'cocktail', item: 'martini', price: 20});

        service.addReceipt({seller: 'Bob', category: 'cocktail', item: 'negroni', price: 10});
        service.addReceipt({seller: 'Bob', category: 'cocktail', item: 'martini', price: 20});

        const payouts = service.calculateAllBonuses(1000);

        expect(payouts).toEqual({
            forecastMet: true, 
            payouts: [
                {seller: 'Alice', totalBonus: 11.5},
                {seller: 'Bob', totalBonus: 1.5}
            ]
        })


    })


    test('returns no payoouts when forecast is not met', () => {
        const service = new BonusService({
            upsellCatalog: {
                steak: ['wagyu'],
                cocktail: ['negroni']
            },
            tierRules: {
                steak: [{minQuantity: 10, percentage: 0.1}],
                cocktail: [{minQuantity: 5, percentage: 0.05}]
            },
            modes: {
                steak: 'PER ITEM',
                cocktail: 'PER ITEM'
            },
            thresholdPercentage: 80,
            monthlyForecast: 10000
        });

        service.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'wagyu',
            price: 500
        });

        const payouts = service.calculateAllBonuses(1000);

        expect(payouts).toEqual({
            forecastMet: false,
            payouts: []
        });
    });
});