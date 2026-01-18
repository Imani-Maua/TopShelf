/* src/core/bonus/BonusService.js */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Engine Imports
const ReceiptParser = require('./engine/receiptParser');
const BonusCalculator = require('./engine/bonusCalculator');
const ForecastChecker = require('./engine/forecastChecker');

class BonusService {
    constructor() {
        this.parser = new ReceiptParser();
    }

    /**
     * 1. UPLOAD PROCESS
     * Parses a CSV file, maps names to DB IDs, and saves valid receipts.
     * 
     * @param {string} filePath - Absolute path to the uploaded CSV
     * @returns {Promise<{ processed: number, errors: Array }>}
     */
    async processUpload(filePath) {
        // A. Parse File (Pure JS)
        const { validRecords, errors } = await this.parser.parse(filePath);

        if (validRecords.length === 0) {
            return { processed: 0, errors };
        }

        // B. Fetch Lookups (Optimize: 2 queries instead of N)
        // We need existing IDs to link the receipts correctly.
        const [participants, products] = await Promise.all([
            prisma.participant.findMany(),
            prisma.product.findMany()
        ]);

        const participantMap = new Map(participants.map(participant => [this.#formatName(participant.firstname, participant.lastname), participant.id]));
        const productMap = new Map(products.map(product => [product.name, product.id]));

        // C. Map & Transform
        const receiptsToSave = [];

        for (const record of validRecords) {
            const participantId = participantMap.get(participantMap.has(record.sellerName) ? record.sellerName : this.#findApproximateMatch(record.sellerName, participantMap));
            // Simple lookup for now. Ideally, use fuzzy matching or exact strict names.
            const productId = productMap.get(record.itemName);

            if (!participantId) {
                errors.push({ row: record.row, message: `Unknown Seller: "${record.sellerName}". Ensure spelling matches database.` });
                continue;
            }
            if (!productId) {
                errors.push({ row: record.row, message: `Unknown Product: "${record.itemName}". Ensure component exists in catalog.` });
                continue;
            }

            receiptsToSave.push({
                participantId: participantId,
                productId: productId,
                date: record.saleDate,
                price: record.price // Snapshot price at time of sale
            });
        }

        // D. Batch Save
        if (receiptsToSave.length > 0) {
            await prisma.receipt.createMany({
                data: receiptsToSave
            });
        }

        return {
            processed: receiptsToSave.length,
            errors: errors
        };
    }

    /**
     * 2. CALCULATION PROCESS
     * Fetches all data for a month, checks forecast, and computes bonuses.
     * 
     * @param {number} month - 1-12
     * @param {number} year - e.g. 2024
     */
    async calculateAllBonuses(month, year, totalRevenue) {

        if (!totalRevenue || totalRevenue < 0) {
            throw new Error(`No total revenue provided for ${month}/${year}`);
        }
        const forecast = await prisma.forecast.findFirst({
            where: { month: month, year: year }
        });

        if (!forecast) {
            throw new Error(`No forecast configured for ${month}/${year}`);
        }

        const checker = new ForecastChecker(forecast.threshold, forecast.targetAmount);

        if (!checker.isForecastMet(totalRevenue)) {
            return {
                forecastMet: false,
                revenues: { total: totalRevenue, target: forecast.targetAmount },
                payouts: []
            };
        }


        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const receipts = await prisma.receipt.findMany({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            include: {
                product: { include: { category: true } },
                participant: true
            }
        });

        if (receipts.length === 0) {
            return { message: "No sales found for this period.", payouts: [] };
        }

       

        if (!checker.isForecastMet(totalRevenue)) {
            return {
                forecastMet: false,
                revenues: { total: totalRevenue, target: forecast.targetAmount },
                payouts: []
            };
        }

        const categories = await prisma.category.findMany({
            include: { tierRules: true }
        });

        const payouts = [];
        const uniqueParticipantIds = [...new Set(receipts.map(receipt => receipt.participantId))];

        for (const pid of uniqueParticipantIds) {
            const userReceipts = receipts.filter(receipt => receipt.participantId === pid);
            let userTotalBonus = 0;
            const details = []; // To show breakdown

            for (const category of categories) {
                const catReceipts = userReceipts.filter(receipt => receipt.product.categoryId === category.id);
                if (catReceipts.length === 0) continue;

                // 1. Prepare Data for Engine
                const salesData = this.#mapToEngineFormat(catReceipts, category.mode);

                // 2. Run Engine
                const tierConfig = new TierConfig(category.tierRules);
                const calculator = new BonusCalculator({
                    category: category.name,
                    tierConfig: tierConfig,
                    mode: category.mode
                });

                const bonus = calculator.calculateBonus(salesData);

                if (bonus > 0) {
                    userTotalBonus += bonus;
                    details.push({ category: category.name, bonus: bonus });
                }
            }

            if (userTotalBonus > 0) {
                payouts.push({
                    participant: {
                        id: pid,
                        name: userReceipts[0].participant.firstname + ' ' + userReceipts[0].participant.lastname
                    },
                    amount: userTotalBonus,
                    breakdown: details
                });
            }
        }

        return {
            forecastMet: true,
            revenues: { total: totalRevenue, target: forecast.targetAmount },
            payouts: payouts.sort((a, b) => b.amount - a.amount) // Highest earner first
        };
    }

    // --- HELPERS ---

    /**
     * Converts raw DB receipts into the structure expected by BonusCalculator.
     */
    #mapToEngineFormat(receipts, mode) {
        if (mode === 'PER CATEGORY') {
            return {
                quantity: receipts.length, // assuming 1 row = 1 item
                revenue: receipts.reduce((sum, receipt) => sum + receipt.price, 0)
            };
        }

        if (mode === 'PER ITEM') {
            const map = {};
            for (const receipt of receipts) {
                const name = receipt.product.name;
                if (!map[name]) map[name] = { quantity: 0, revenue: 0 };
                map[name].quantity += 1;
                map[name].revenue += receipt.price;
            }
            return map;
        }
        return null;
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

module.exports = BonusService;