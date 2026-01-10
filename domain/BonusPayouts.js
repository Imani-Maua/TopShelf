class BonusPayouts{
    /**
     * 
     * @param {Object} calculators - Map of category name -> BonusCalculator
     * eg {steak:SteakCalculator}, {cocktail: CocktailCalculator}
     */
    constructor(calculators){
        this.calculators = calculators 
    }

   /**
    * Calculate total bonus per seller
    * 
    * @param {Object} aggregatedSales - Output of ReceiptAggregator
    * { 
    *   Alice: {
    *        steak: {ribeye: {quantity, revenue}, wagyu: {...}},
    *        cocktail: {negroni: {...}, {...}}
    *     },
    * Bob: {...} 
    * 
    * }
    * @returns {Array{<seller: string, totalBonus: number}>}
    */
    calculateBonuses(aggregatedSales){
        const sales = [];
        

        for(const [seller, categories] of Object.entries(aggregatedSales)){
            let totalBonus = 0;

            for (const [category, salesData] of Object.entries(categories)){
                const calculator = this.calculators[category]
                if(!calculator) continue;

                totalBonus += calculator.calculateBonus(salesData);
            } 
             sales.push({seller, totalBonus});

        }

        return sales

    }
}


module.exports = BonusPayouts;