const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ReceiptParser = require("../engine/receiptParser");




class ParsingService {

    constructor() {
        this.parser = new ReceiptParser();
    }


    /**
     * Upload process
     * Parses a CSV file, maps to DB IDs, and saves valid receipts.
     * 
     * 
     * @param {string} filePath  - Absolute path to the uploaded CSV
     * @param {Object} filter - Optional filter { month, year }
     * @returns {Promise<{processed: number, errors: Array, monthBreakdown: Object}>}
     */
    async uploadReceipts(filePath, filter = null) {

        const { validRecords, errors } = await this.parser.parse(filePath);
        if (validRecords.length === 0)
            return { processed: 0, errors, monthBreakdown: {} };

        const [participants, products] = await Promise.all([
            prisma.participant.findMany(),
            prisma.product.findMany()
        ]);

        const participantMap = new Map(participants.map(participant => [this.#formatName(participant.firstname, participant.lastname), participant.id]));
        const productMap = new Map(products.map(product => [product.name, product.id]));

        const receiptsToSave = [];
        const monthBreakdown = {};

        for (const records of validRecords) {
            const participantId = participantMap.get(participantMap.has(records.sellerName) ? records.sellerName : this.#findApproximateMatch(records.sellerName, participantMap));

            const productId = productMap.get(records.itemName);

            if (!participantId) {
                errors.push({ row: records.row, message: `Unknown seller: "${records.sellerName}". Ensure spelling matches database.` });
                continue;
            }

            if (!productId) {
                continue;
            }

            // Apply month/year filter if provided
            if (filter) {
                const receiptMonth = records.saleDate.getMonth() + 1; // 0-indexed
                const receiptYear = records.saleDate.getFullYear();

                if (receiptMonth !== filter.month || receiptYear !== filter.year) {
                    errors.push({
                        row: records.row,
                        message: `Skipped: Receipt date ${records.saleDate.toISOString().split('T')[0]} does not match filter (${filter.month}/${filter.year})`
                    });
                    continue;
                }
            }

            // Track month breakdown
            const receiptMonth = records.saleDate.getMonth() + 1;
            const receiptYear = records.saleDate.getFullYear();
            const monthKey = `${receiptYear}-${String(receiptMonth).padStart(2, '0')}`;

            if (!monthBreakdown[monthKey]) {
                monthBreakdown[monthKey] = { month: receiptMonth, year: receiptYear, count: 0 };
            }
            monthBreakdown[monthKey].count++;

            receiptsToSave.push({
                participantId: participantId,
                productId: productId,
                date: records.saleDate,
                price: records.quantity * records.price // Total price = quantity × unit price
            });

        }

        if (receiptsToSave.length > 0) {
            await prisma.receipt.createMany({
                data: receiptsToSave
            });
        }

        return {
            processed: receiptsToSave.length,
            errors: errors,
            monthBreakdown: monthBreakdown
        };

    }


    #formatName(first, last) {
        return `${first} ${last}`;
    }

    // Placeholder for fuzzy matching if we ever need it
    #findApproximateMatch(name, map) {
        // logic could go here
        return null;
    }


}


module.exports = ParsingService;