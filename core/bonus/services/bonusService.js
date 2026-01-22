const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { formatDataForCalculation } = require('./utils');
const BonusCalculator = require('../engine/bonusCalculator');
const ForecastChecker = require('../engine/forecastChecker');
const BonusPayouts = require('../engine/bonusPayouts');

class BonusService {

    /**
     * 
     * @param {Number} month 1-12
     * @param {Number} year eg 2026
     * @param {Number} totalRevenue - total amount of money restaurant made in a month
     */
    async calculateAllBonuses(month, year, totalRevenue) {
        if (!totalRevenue || totalRevenue < 0)
            throw new Error(`No total revenue provided for ${month}/${year}`);

        const forecast = await prisma.forecast.findFirst({
            where: { month, year }
        });

        if (!forecast)
            throw new Error(`Forecast not found for ${month}/${year}`);

        const checker = new ForecastChecker(forecast.threshold, forecast.targetAmount);

        if (!checker.isForecastMet(totalRevenue)) {
            return {
                forecastMet: false,
                revenues: { total: totalRevenue, target: forecast.targetAmount },
                payouts: []
            };
        }

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59);

        const receipts = await prisma.receipt.findMany({
            where: { date: { gte: monthStart, lte: monthEnd } },
            include: {
                product: { include: { category: true } },
                participant: true
            }
        });

        if (receipts.length === 0)
            return { message: "No sales found for this period.", payouts: [] };

        const categories = await prisma.category.findMany({ include: { tierRules: true } });

        // Prepare calculators per category
        const calculators = {};
        categories.forEach(category => {
            calculators[category.name] = new BonusCalculator({ category: category.name });
        });

        // Aggregate sales per participant per category
        const aggregatedReceipts = {}; // participantId -> categoryName -> [receipts]
        const participantsMap = {}; // participantId -> name

        for (const receipt of receipts) {
            const pid = receipt.participantId;
            const categoryName = receipt.product.category.name;

            if (!aggregatedReceipts[pid]) aggregatedReceipts[pid] = {};
            if (!aggregatedReceipts[pid][categoryName]) aggregatedReceipts[pid][categoryName] = [];

            aggregatedReceipts[pid][categoryName].push(receipt);

            if (!participantsMap[pid]) {
                participantsMap[pid] = `${receipt.participant.firstname} ${receipt.participant.lastname}`;
            }
        }

        // Now format the aggregated data for calculation
        const aggregatedSales = {};
        for (const pid in aggregatedReceipts) {
            aggregatedSales[pid] = {};
            for (const categoryName in aggregatedReceipts[pid]) {
                const receiptsForCategory = aggregatedReceipts[pid][categoryName];
                const category = categories.find(c => c.name === categoryName);

                if (category) {
                    const salesData = formatDataForCalculation(receiptsForCategory, category.mode, category.tierRules);
                    const salesArray = Array.isArray(salesData) ? salesData : [salesData];
                    aggregatedSales[pid][categoryName] = salesArray;
                }
            }
        }

        // Calculate all bonuses via BonusPayouts
        const bonusPayouts = new BonusPayouts(calculators);
        const payoutsArray = bonusPayouts.calculateBonuses(aggregatedSales);

        // Map to service output format
        const payouts = payoutsArray.map(payout => ({
            participant: {
                id: payout.seller,
                name: participantsMap[payout.seller]
            },
            amount: payout.totalBonus,
            breakdown: payout.breakdown
        }));

        // Persist payouts to database
        const period = `${year}-${month.toString().padStart(2, '0')}`;

        // Clear existing payouts for this period to avoid duplicates
        await prisma.bonusPayout.deleteMany({
            where: { period }
        });

        // Save new payouts
        if (payouts.length > 0) {
            await prisma.bonusPayout.createMany({
                data: payouts.map(p => ({
                    participantId: p.participant.id,
                    amount: p.amount,
                    period: period,
                    breakdown: p.breakdown
                }))
            });
        }

        return {
            forecastMet: true,
            revenues: { total: totalRevenue, target: forecast.targetAmount },
            payouts: payouts.sort((a, b) => b.amount - a.amount)
        };
    }

    /**
     * Get all bonus payouts for dashboard display
     */
    async getAllPayouts() {
        return await prisma.bonusPayout.findMany({
            include: {
                participant: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Increased limit for detailed views
        });
    }

    /**
     * Get payout history for a specific participant
     */
    async getParticipantPayouts(participantId) {
        return await prisma.bonusPayout.findMany({
            where: { participantId },
            orderBy: { createdAt: 'desc' }
        });
    }

}

module.exports = BonusService;
