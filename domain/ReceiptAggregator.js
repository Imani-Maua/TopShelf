class ReceiptAggregator{
    /**
     * Initializes the aggregator with the upsell catalog
     * @param {Object} upsellCatalog  - A map of categories to arrays of eligible upsell items.
     */
    constructor(upsellCatalog){
        this.upsellCatalog = upsellCatalog;
        this.data = {}; //will store aggregated sales per seller -> category -> item
    }

    /**
     * 
     * @param {string} category - Item category eg steak, cocktail
     * @param {string} item - Specific item name eg ribeye, negroni
     * @returns {boolean} True if item is eligible for upsell bonuses
     */
    isUpsellItem(category, item){
        return(
            this.upsellCatalog[category] && 
            this.upsellCatalog[category].includes(item)
        );
    }

   /**
    * Processes a single receipt line and updates aggregated sales
    * Only counts items that are part of the upsell program
    * @param {Object} receipt - a single sale record
    * @param {string} receipt.seller - Name of the person who sold the item
    * @param {string} receipt.category - Item category
    * @param {string} receipt.item - Item name
    * @param {number} receipt.price - Sale price of the item
    * 
    */
    addReceipt(receipt){
        const {seller, category, item, price} = receipt;

        //ignore non-upsell items
        if(!this.isUpsellItem(category, item)){
            return;
        }

        //initialize nested objects if they do not exist
        if(!this.data[seller]){
            this.data[seller] = {};
        }

        if(!this.data[seller][category]){
            this.data[seller][category] = {};
        }

        if(!this.data[seller][category][item]){
            this.data[seller][category][item] = {
                quantity: 0,
                revenue: 0
            };
        }

        //increment quantity and revenue
        this.data[seller][category][item].quantity += 1;
        this.data[seller][category][item].revenue += price;

    }

    /**
     * 
     * @returns aggregated salesdata for all the sellers
     * Output shape: {
     * sellerName:{
     *      category: {
     *          itemName: { quantity: number, revenue: number}
     *           }
     *      }
     *  }
     */
    getAggregatedData(){
        return this.data;
    }

}


module.exports = ReceiptAggregator;
