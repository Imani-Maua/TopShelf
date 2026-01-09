/**
 * BonusCalculator computes upsell bonuses using tier-based rules.
 * 
 * It supports two calculation modes:
 * - PER ITEM: bonus is calculated independently per item
 * - PER CATEGORY: bonus is calculated on aggregated category totals
 */


class BonusCalculator{
    /**
     * 
     * Creates a Bonus Calculator
     * 
     * @param {Object} options
     * @param {string} options.category - Category name (eg steak, cocktails, desserts)
     * @param {TierConfig} options.tierConfig - TierConfig instance
     * @param {'PER ITEM | PER CATEGORY'} options.mode - calculation mode
     */
    constructor({category, tierConfig, mode}){
        if(!category) throw new Error('category is required');
        if(!tierConfig) throw new Error('tierConfig is required');
        if(!mode) throw new Error('mode is required');


        this.category = category;
        this.tierConfig = tierConfig;
        this.mode = mode;
    }

    /**
     * Calculates the total bonus for the given sales data.
     * @param {Object} salesData 
     * 
     * in PER ITEM mode:
     * {
     *   itemName: {quantity: number, revenue: number}
     * }
     * 
     * in PER CATEGORY mode:
     * {
     *  quantity: number,
     *  revenue: number
     * }
     * @returns {number} Total bonus amount
     * 
     * @throws {Error} If unsupported calculation mode is provided
     */
    calculateBonus(salesData){
        if(!salesData) return 0;

        if(this.mode === 'PER ITEM')
            return this.#calculatePerItemBonus(salesData);

        if(this.mode === 'PER CATEGORY')
            return this.#calculatePerCategoryBonus(salesData);

        throw new Error(`Unsupported bonus calculation mode: ${this.mode}`);
    }


    /**
     * 
     * @private
     * @param {Object<string, {quantity: number, revenue: number}>} items
     * @returns {number} Total bonus across all items
     */
    #calculatePerItemBonus(items){
        let totalBonus = 0;

        for(const item of Object.values(items)){
            const tier = this.tierConfig.getApplicableTier(item.quantity);
            if(!tier) continue;

            totalBonus += item.revenue * tier.percentage;
        }

        return totalBonus;

    }
    /**
     * Aggregates the data for items whose calculations are done by category
     * @private
     * @param {Object<string, {quantity: number, revenue: number}>} items
     * @returns {Object {quantity: number, revenue: number}}
     */
    #aggregateCategory(items){
        let totalQuantity = 0;
        let totalRevenue = 0;

        for(const {quantity, revenue} of Object.values(items)){
            totalQuantity += quantity;
            totalRevenue += revenue;
        }

        return {
            quantity: totalQuantity,
            revenue: totalRevenue
        };
    }

    /**
     * Calculates  bonus based on aggregated category totals
     * @param {{quantity: number, revenue: number}} categoryData 
     * @returns {number} Total category bonus
     * 
     */
    #calculatePerCategoryBonus(items){
        const categoryData = this.#aggregateCategory(items)
        const tier = this.tierConfig.getApplicableTier(categoryData.quantity);
        if(!tier) return 0;

        return categoryData.revenue * tier.percentage;
    }

}

module.exports = BonusCalculator;