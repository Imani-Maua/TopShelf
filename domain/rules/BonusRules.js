/**
 * Abstract base class for upsell bonus rules
 * Each category extends this class and implement its own `calculateBonus` logic
 */

class BonusRule{
    /**
     * 
     * @param {Object} options
     * @param {string} options.category - The category this rule applies to
     * @param {Array<{minQuantity: number, percentage: number}>} options.tiers - Tier rules
     */
    constructor({category, tiers}){
        if(!category){
            throw new Error('BonusRule requires a category!');
        }

        this.category = category;

        // Validate tiers and sort them ascending by minQuantity
        this.tiers = this.#validateAndNormalizeTiers(tiers);
    }

   /**
    * Abstract method: calculates the bonus for the set of sales
    * Must be implementedby subclass
    * @param {*} _  - Input data, depends on subclass logic (per-item or per-category)
    * @throws Error if called directly
    */
    calculateBonus(_){
        throw new Error(
            `calculateBonus() must be implemented by ${this.constructor.name}`
        );
    }

    /**
     * Returns the tier that applies to a given quantity
     * Picks the highest tier that is less than or equal to the quantity
     * @param {number} quantity - Number of items sold
     * @returns {Object | null} The applicable tier or null if none match
     */
    getApplicableTier(quantity){
        let applicableTier = null;

        for(const tier of this.tiers){
            if(quantity >= tier.minQuantity){
                applicableTier = tier;
            }
        }
        return applicableTier;
    }


    /**
     * Private helper: validates the tier array and normalizes it.
     * Ensures that:
     *  - tiers is a non-empty array
     *  - each tier has minQuantity and percentage numbers
     *  - percentage is between 0 and 1
     *  - tiers are sorted ascending by minQuantity
     * @param {Array} tiers 
     * @returns {Array} Normalized and sorted tiers
     * @throws Error if validation fails
     */
    #validateAndNormalizeTiers(tiers){
        if(!Array.isArray(tiers) || tiers.length === 0){
            throw new Error('tiers must be a non-empty array');
        }

        const normalized = tiers.map(tier => {
            if(
            typeof tier.minQuantity !== 'number' ||
            typeof tier.percentage !== 'number')
            {
                throw new Error('Invalid tier format');
            }

            if(tier.percentage < 0 || tier.percentage > 1){
                throw new Error('percentage must be between 0 and 1');
            }

            return{
                minQuantity: tier.minQuantity,
                percentage: tier.percentage
            };
        });

        normalized.sort((a, b) => a.minQuantity - b.minQuantity);
        return normalized;


    }
}


module.exports = BonusRule;