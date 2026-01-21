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
     * @param {Array<{productName, quantity, revenue, tier, products}>} salesData
     * @returns {Object} {totalBonus: Number, items: Array}
     */
    calculateBonus(salesData) {
        if (!Array.isArray(salesData) || salesData.length === 0) {
            return { totalBonus: 0, items: [] };
        }

        let totalBonus = 0;
        const items = [];

        for (const sale of salesData) {
            const { productName, quantity, revenue, tier, products } = sale;

            let qualified = false;
            let reason = null;
            let bonus = 0;
            let tierQualified = null;
            let bonusPercentage = 0;

            if (tier && typeof tier.bonusPercentage === 'number' && tier.bonusPercentage > 0) {
                // Qualified for bonus!
                qualified = true;
                bonus = revenue * tier.bonusPercentage / 100;
                tierQualified = `${tier.minQuantity}+ items`;
                bonusPercentage = tier.bonusPercentage;
                totalBonus += bonus;
            } else {
                // Didn't qualify - explain why
                qualified = false;
                reason = `Below minimum threshold (sold ${quantity})`;
            }

            items.push({
                productName,
                quantity,
                revenue,
                tierQualified,
                bonusPercentage,
                bonus,
                qualified,
                reason,
                products  // For PER_CATEGORY mode
            });
        }

        return { totalBonus, items };
    }
}

module.exports = BonusCalculator;
