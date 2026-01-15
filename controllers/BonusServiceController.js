

class BonusController{
    /**
     * 
     * @param {class} bonusService | BonusService is the class that combines all the domain logic and gives us a final calculation of bonuses for all employees
     */
    constructor(bonusService){
        this.bonusService = bonusService;
    }

    run({receipts, totalRevenue}){
        receipts.forEach(receipt => this.bonusService.addReceipt(receipt));
        return this.bonusService.calculateAllBonuses(totalRevenue);
    }
}


module.exports = BonusController;