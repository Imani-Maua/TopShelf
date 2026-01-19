const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {formatDataForCalculation} = require('./utils');
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
            throw new Error(`No forecast configured for ${month}/${year}`);

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
        const aggregatedSales = {}; // participantId -> categoryName -> [salesData]
        const participantsMap = {}; // participantId -> name
        for (const receipt of receipts) {
            const pid = receipt.participantId;
            const categoryName = receipt.product.category.name;
            const category = categories.find(category => category.id === receipt.product.categoryId);

            if (!aggregatedSales[pid]) aggregatedSales[pid] = {};
            if (!aggregatedSales[pid][categoryName]) aggregatedSales[pid][categoryName] = [];

            const salesData = formatDataForCalculation([receipt], category.mode, category.tierRules);
            const salesArray = Array.isArray(salesData) ? salesData : [salesData];
            aggregatedSales[pid][categoryName].push(...salesArray);

            if (!participantsMap[pid]) {
                participantsMap[pid] = `${receipt.participant.firstname} ${receipt.participant.lastname}`;
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

        return {
            forecastMet: true,
            revenues: { total: totalRevenue, target: forecast.targetAmount },
            payouts: payouts.sort((a, b) => b.amount - a.amount)
        };
    }

    


}

module.exports = BonusService;
