const BonusPayouts = require('../../domain/BonusPayouts');

describe('BonusPayouts', ()=>{
    test('calculates total bonus per seller using category calculators', ()=>{
        const steakCalculator = {
            calculateBonus: jest.fn().mockReturnValue(100)
        };
        const cocktailCalculator = {
            calculateBonus: jest.fn().mockReturnValue(50)
        };

        const calculators = {
            steak: steakCalculator,
            cocktail: cocktailCalculator
        };

        const bonusPayouts = new BonusPayouts(calculators);


        const aggregatedSales = {
            Alice: {
                steak: {
                    ribeye: {quantity: 10, revenue: 1000}
                },
                cocktail: {
                    negroni: {quantity: 5, revenue: 75}
                }
            }
        };

        const payouts = bonusPayouts.calculateBonuses(aggregatedSales);

        expect(payouts).toEqual([
            {seller: 'Alice', totalBonus: 150}
        ]);

        expect(cocktailCalculator.calculateBonus).toHaveBeenCalledWith(
            aggregatedSales.Alice.cocktail
        );

        expect(steakCalculator.calculateBonus).toHaveBeenCalledWith(
            aggregatedSales.Alice.steak
        );
    });

    test('ignores unknown category', ()=>{
        const steakCalculator = {
            calculateBonus: jest.fn().mockReturnValue(100)
        };
        const cocktailCalculator = {
            calculateBonus: jest.fn().mockReturnValue(75)
        };

        const calculators = {
            steak: steakCalculator,
            cocktail: cocktailCalculator
        };
        const bonusPayouts = new BonusPayouts(calculators);

        const aggregatedSales = {
            Alice: {
                steak: {
                    ribeye: {quantity: 10, revenue: 1000}
                },
                cocktail: {
                    negroni: {quantity: 5, revenue: 75}
                },
                dessert: {
                    cheesecake: {quantity: 12, revenue: 50}
                }
            }
        };

        const payouts = bonusPayouts.calculateBonuses(aggregatedSales);

        expect(payouts).toEqual([
            {seller: 'Alice', totalBonus: 175}
        ]);

        expect(steakCalculator.calculateBonus).toHaveBeenCalledTimes(1);
        expect(cocktailCalculator.calculateBonus).toHaveBeenCalledTimes(1);
    });
    
});