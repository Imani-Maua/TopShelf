const BonusController = require('../../controllers/BonusServiceController');
const BonusService = require('../../services/BonusService');


describe('Bonus Controller Integration', ()=> {

    let controller;

    beforeEach(()=>{
        service = new BonusService({
            upsellCatalog: {
                steak: ['ribeye', 'wagyu'],
                cocktail: ['negroni', 'martini'],
                dessert: ['cheesecake']
            },
            tierRules: {
                steak: [
                    {minQuantity: 2, percentage: 0.05},
                    {minQuantity: 5, percentage: 0.1}
                ],
                cocktail: [
                    {minQuantity: 2, percentage: 0.05},
                    {minQuantity: 10, percentage: 0.1}
                ],
                dessert: [
                    {minQuantity: 5, percentage: 0.05}
                ]
            },
            modes: {
                steak: 'PER ITEM',
                cocktail: 'PER CATEGORY',
                dessert: 'PER ITEM'
            },
            thresholdPercentage: 80,
            monthlyForecast: 200
        });
        
        controller = new BonusController(service);

        
    });
    

    
    test('calculates bonuses correctly for multiple sellers when forecast is met', ()=>{
        
        const receipts = [
        { seller: 'Alice', category: 'steak', item: 'wagyu', price: 100 },
        { seller: 'Alice', category: 'steak', item: 'wagyu', price: 100 },
        { seller: 'Alice', category: 'steak', item: 'ribeye', price: 100 },
        { seller: 'Alice', category: 'cocktail', item: 'negroni', price: 10 },
        { seller: 'Alice', category: 'cocktail', item: 'martini', price: 20 },
        { seller: 'Alice', category: 'dessert', item: 'cheesecake', price: 50 },
        { seller: 'Bob', category: 'cocktail', item: 'negroni', price: 10 },
        { seller: 'Bob', category: 'cocktail', item: 'martini', price: 20 }
    ]
        const totalRevenue = 850;
        const payouts = controller.run({receipts, totalRevenue});

        expect(payouts.forecastMet).toBe(true);
        expect(payouts.payouts).toEqual(
            [
            {seller: 'Alice', totalBonus: expect.any(Number)},
            {seller: 'Bob', totalBonus: expect.any(Number)}
        ]);
    });

    test('returns empty payouts when forecast is not met', ()=>{
        const receipts = [
            {seller: 'Alice', category: 'steak', item: 'wagyu', price: 50}
        ];

        const totalRevenue = 50;
        const payouts = controller.run({receipts, totalRevenue});
        expect(payouts.forecastMet).toBe(false);
        expect(payouts.payouts).toEqual(
            []
        );
    });
});
