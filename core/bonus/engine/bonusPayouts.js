class BonusPayouts {
    /**
     * @param {Object} calculators - Map of category name -> BonusCalculator
     * e.g., { steak: new BonusCalculator({category:'steak'}), cocktail: new BonusCalculator({...}) }
     */
    constructor(calculators) {
        this.calculators = calculators;
    }

    /**
     * Calculate total bonus per seller
     * @param {Object} aggregatedSales - Output of ReceiptAggregator
     * {
     *   Alice: {
     *        steak: [ {quantity, revenue, tier}, ... ],
     *        cocktail: [ {quantity, revenue, tier}, ... ]
     *     },
     *   Bob: { ... }
     * }
     * @returns {Array} - Array of payouts with total and breakdown
     * [
     *   { seller: 'Alice', totalBonus: 123.45, breakdown: [ {category:'steak', bonus:50}, {...} ] },
     *   { seller: 'Bob', totalBonus: 67.8, breakdown: [ ... ] }
     * ]
     */
    calculateBonuses(aggregatedSales) {
        const payouts = [];

        for (const [seller, categories] of Object.entries(aggregatedSales)) {
            let totalBonus = 0;
            const breakdown = [];

            for (const [category, salesData] of Object.entries(categories)) {
                const calculator = this.calculators[category];
                if (!calculator) continue;

                const result = calculator.calculateBonus(salesData);
                if (result.totalBonus > 0) {
                    totalBonus += result.totalBonus;
                    breakdown.push({
                        category,
                        bonus: result.totalBonus,
                        items: result.items
                    });
                }
            }

            if (totalBonus > 0) {
                payouts.push({ seller, totalBonus, breakdown });
            }
        }

        return payouts.sort((a, b) => b.totalBonus - a.totalBonus);
    }
}

module.exports = BonusPayouts;
