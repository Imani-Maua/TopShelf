class BonusCalculator {
    /**
     * @param {Object} options
     * @param {string} options.category - Category name (e.g., 'steaks', 'cocktails')
     */
    constructor({ category }) {
        if (!category) throw new Error('category is required');
        this.category = category;
    }

    /**
     * Calculates total bonus based on prepared sales data
     * @param {Array<{quantity: Number, revenue: Number, tier: {minQuantity: Number, bonusPercentage: Number} | null}>} salesData
     * @returns {Number} total bonus
     */
    calculateBonus(salesData) {
        if (!Array.isArray(salesData) || salesData.length === 0) return 0;

        let totalBonus = 0;

        for (const sale of salesData) {
            const { quantity, revenue, tier } = sale;

            // Skip if no tier applies
            if (!tier || typeof tier.bonusPercentage !== 'number') continue;

            // Bonus = revenue * bonusPercentage / 100
            totalBonus += revenue * tier.bonusPercentage;
        }

        return totalBonus;
    }
}

module.exports = BonusCalculator;
