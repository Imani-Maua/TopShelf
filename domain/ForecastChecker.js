
class ForecastChecker {
    /**
     * 
     * @param {number} thresholdPercent - configurable percentage of the forecast threshold that needs to be reached
     * @param {number} monthlyForecast - the monthly forecast
     */
    constructor(thresholdPercent, monthlyForecast) {
        this.thresholdPercent = thresholdPercent;
        this.monthlyForecast = monthlyForecast
    }
    /**
     * 
     * @param {number} totalRevenue - amount of money made in a given month
     * @returns {boolean} True if forecast threshold is met, False otherwise
     */
    isForecastMet(totalRevenue){
        const requiredRevenue = this.monthlyForecast * (this.thresholdPercent/100);
        return totalRevenue >= requiredRevenue;
    }

}


module.exports = ForecastChecker;

