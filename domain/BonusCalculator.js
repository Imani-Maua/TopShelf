
class BonusCalculator{
    /**
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

    calculateBonus(salesData){
        if(!salesData) return 0;

        if(this.mode === 'PER ITEM')
            return this.#calculatePerItemBonus(salesData);

        if(this.mode === 'PER CATEGORY')
            return this.#calculatePerCategoryBonus(salesData);

        throw new Error(`Unsupported bonus calculation mode: ${this.mode}`);
    }

    #calculatePerItemBonus(items){
        let totalBonus = 0;

        for(const item of Object.values(items)){
            const tier = this.tierConfig.getApplicableTier(item.quantity);
            if(!tier) continue;

            totalBonus += item.revenue * tier.percentage;
        }

        return totalBonus;

    }

    #calculatePerCategoryBonus(categoryData){
        const {quantity, revenue} =categoryData;

        const tier = this.tierConfig.getApplicableTier(quantity);
        if(!tier) return 0;

        return revenue * tier.percentage;
    }
   
}

module.exports = BonusCalculator;