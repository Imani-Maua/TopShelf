/**
 * TierConfig handles validation and normalization of bonus tiers
 * Ensures that tiers are correctly formatted and sorted in ascending order
 * 
 * Examples of tiers:
 * 
 * [
 * {minQuantity: 10, percentage: 0.05},
 * {minQuantity: 21, percentage: 0.1},
 * {minQuantity: 31, percentage: 0.15}
 * ]
 */

class TierConfig{
    /**
     * Creates a TierConfig instance.
     * @param {Array<{minQuantity: number, percentage: number}>} tiers -Array of tier objects
     * 
     * Each item must have:
     * - minQuantity: minimum quantity to reach this tier
     * - percentage: bonus percentage (0 to 1)
     * 
     * @throws Will throw an error if tiers is not a non-empty array or if
     *          any tier has an invalid format or percentage out of bounds.
     */
    constructor(tiers){
        this.tiers = this.#validateAndNormalizeTiers(tiers);
    }


    /**
     * Private helper: validates each tier and sorts them ascending by minQuantity
     * @param {Array<{minQuantity: number, percentage: number}>} tiers
     * @returns {Array<{minQuantity: number, percentage: number}>} normalized tiers
     * @throws Error if tiers is invalid
     */
    #validateAndNormalizeTiers(tiers){
        if(!Array.isArray(tiers) || tiers.length === 0){
            throw new Error('tiers must be a non-empty array');
        }

        const normalized = tiers.map(tier =>{
            if(typeof tier.minQuantity !== 'number' || typeof tier.percentage !== 'number')
                throw new Error('Invalid tier format');
            if(tier.percentage < 0 || tier.percentage > 1)
                throw new Error('percentage must be between 0 and 1');
            return {minQuantity: tier.minQuantity, percentage: tier.percentage};
        });

        normalized.sort((a, b) => a.minQuantity - b.minQuantity);
        return normalized;
    }

    /**
     * Returns the normalized and sorted tiers.
     * @returns {Array<{minQuantity: number, percentage: number}>} 
     * Array of tiers sorted by minQuantity ascending
     */
    getApplicableTier(quantity){
        let applicableTier = null;

        for(const tier of this.tiers){
            if(quantity >= tier.minQuantity)
                applicableTier = tier
        }
        return applicableTier;
    }

}

module.exports = TierConfig;