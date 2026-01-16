const ReceiptAggregator = require('../bonus/engine/receiptAggregator');
const TierConfig = require('../bonus/engine/tierConfig');
const BonusCalculator = require('../bonus/engine/bonusCalculator');
const BonusPayouts = require('../bonus/engine/bonusPayouts');
const ForecastChecker = require('../bonus/engine/forecastChecker');


class BonusService{

    /**
     * 
     * @param {Object} options
     * @param {Object} options.upsellCatalog - Map of category -> eligible items
     * @param {Object} options.tierRules - Map of category -> tier array
     * @param {Object} options.modes - Map of category -> 'PER ITEM' | 'PER CATEGORY'
     * @param {number} options.thresholdPercentage - Forecast threshold percentage
     * @param {number} options.monthlyForecast - Monthly revenue forecast
     */
    constructor({upsellCatalog, tierRules, modes, thresholdPercentage, monthlyForecast}){
        this.aggregator = new ReceiptAggregator(upsellCatalog);

        this.calculators = {};
        for(const category of Object.keys(tierRules)){
            const tierConfig = new TierConfig(tierRules[category]);
            const mode = modes[category];
            this.calculators[category] = new BonusCalculator({category, tierConfig, mode});
        }

        this.bonusPayouts = new BonusPayouts(this.calculators);
        this.forecastChecker = new ForecastChecker(thresholdPercentage, monthlyForecast);
    }

    /**
     * Add a single receipt to the aggregator
     * @param {Object} receipt - {seller, category, item, price}
     */
    addReceipt(receipt){
        this.aggregator.addReceipt(receipt);
    }

    /**
     * Calculate bonuses for all sellers
     * @returns {Array<seller: string, totalBonus: number>}
     */
    calculateAllBonuses(totalRevenue){
        if(!this.forecastChecker.isForecastMet(totalRevenue))
            return {
            forecastMet: false,
            payouts: []
        };

        const aggregatedSales = this.aggregator.getAggregatedData();
        return {
            forecastMet: true,
            payouts: this.bonusPayouts.calculateBonuses(aggregatedSales)};
    }


}

module.exports = BonusService;