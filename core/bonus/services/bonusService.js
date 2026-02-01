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

        // Calculate bonus-eligible revenue from receipts
        const bonusEligibleRevenue = receipts.reduce((sum, r) => sum + r.price, 0);

        // Track data completeness
        const uniqueDates = [...new Set(receipts.map(r =>
            r.date.toISOString().split('T')[0]
        ))].sort();

        const daysInMonth = new Date(year, month, 0).getDate();
        const missingDays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (!uniqueDates.includes(dateStr)) {
                missingDays.push(dateStr);
            }
        }

        const dataCompleteness = {
            startDate: uniqueDates[0] || null,
            endDate: uniqueDates[uniqueDates.length - 1] || null,
            daysWithData: uniqueDates.length,
            totalDays: daysInMonth,
            missingDays: missingDays,
            completenessPercentage: Math.round((uniqueDates.length / daysInMonth) * 100)
        };

        const categories = await prisma.category.findMany({ include: { tierRules: true } });

        // CRITICAL VALIDATION: Ensure all categories have at least one tier rule
        const categoriesWithoutRules = categories.filter(cat => cat.tierRules.length === 0);
        if (categoriesWithoutRules.length > 0) {
            const categoryNames = categoriesWithoutRules.map(category => category.name).join(', ');
            throw new Error(
                `Cannot calculate bonuses: The following categories have no tier rules configured: ${categoryNames}. ` +
                `Please add tier rules for all categories before calculating bonuses.`
            );
        }

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

        return {
            forecastMet: true,
            revenues: {
                total: totalRevenue,
                bonusEligible: bonusEligibleRevenue,
                target: forecast.targetAmount
            },
            dataCompleteness: dataCompleteness,
            payouts: payouts.sort((a, b) => b.amount - a.amount)
        };
    }




}

module.exports = BonusService;
