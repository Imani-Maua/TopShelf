const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ReceiptParser = require("../engine/receiptParser");




class ParsingService{

    constructor() {
        this.parser = new ReceiptParser();
    }


    /**
     * Upload process
     * Parses a CSV file, maps to DB IDs, and saves valid receipts.
     * 
     * 
     * @param {string} filePath  - Absolute path to the uploaded CSV
     * @returns {Promise<{processed: number, errors: Array}>}
     */
    async uploadReceipts(filePath){

        const {validRecords, errors}  = await this.parser.parse(filePath);
        if(validRecords.length === 0)
            return {processed: 0, errors};

        const [participants, products] = await Promise.all([
            prisma.participant.findMany(),
            prisma.product.findMany()
        ]);

        const participantMap = new Map(participants.map(participant => [this.#formatName(participant.firstname, participant.lastname), participant.id]));
        const productMap = new Map(products.map(product => [product.name, product.id]));

        const receiptsToSave = [];

        for(const records of validRecords){
            const participantId = participantMap.get(participantMap.has(records.sellerName) ? records.sellerName : this.#findApproximateMatch(records.sellerName, participantMap));

            const productId = productMap.get(records.itemName);

            if(!participantId){
                errors.push({row: records.row, message: `Unknown seller: "${records.sellerName}". Ensure spelling matches database.` });
                continue;
            }

            if(!productId){
                errors.push({row: records.row, message: `Unknown Product: "${records.itemName}". Ensure component exists in catalog.`});
                continue;
            }

            receiptsToSave.push({
                participantId: participantId,
                productId: productId,
                date: records.saleDate,
                price: records.price
            });
                
        }

        if(receiptsToSave.length > 0){
                await prisma.receipt.createMany({
                    data: receiptsToSave
                });
            }

            return {
                processed: receiptsToSave.length,
                errors: errors
            };

        }


    #formatName(first, last){
        return `${first} ${last}`;
    }

    // Placeholder for fuzzy matching if we ever need it
    #findApproximateMatch(name, map) {
        // logic could go here
        return null;
    }
    

}


module.exports = ParsingService;