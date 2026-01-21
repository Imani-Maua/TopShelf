const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyData() {
    console.log('🔍 Verifying seeded data...\n');

    // Count all entities
    console.log('📊 Entity Counts:');
    const participantCount = await prisma.participant.count();
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    const tierRuleCount = await prisma.tierRule.count();
    const receiptCount = await prisma.receipt.count();
    const forecastCount = await prisma.forecast.count();

    console.log(`   • Participants: ${participantCount}`);
    console.log(`   • Categories: ${categoryCount}`);
    console.log(`   • Products: ${productCount}`);
    console.log(`   • Tier Rules: ${tierRuleCount}`);
    console.log(`   • Receipts: ${receiptCount}`);
    console.log(`   • Forecasts: ${forecastCount}\n`);

    // Verify participants
    console.log('👥 Participants:');
    const participants = await prisma.participant.findMany({
        include: {
            receipts: true
        }
    });

    for (const p of participants) {
        console.log(`   • ${p.firstname} ${p.lastname}: ${p.receipts.length} receipts`);
    }
    console.log('');

    // Verify categories with modes
    console.log('📂 Categories:');
    const categories = await prisma.category.findMany({
        include: {
            products: true,
            tierRules: {
                orderBy: { minQuantity: 'asc' }
            }
        }
    });

    for (const c of categories) {
        console.log(`   • ${c.name} (${c.mode}):`);
        console.log(`     - Products: ${c.products.length}`);
        console.log(`     - Tier Rules: ${c.tierRules.length}`);
        c.tierRules.forEach(tr => {
            console.log(`       * ${tr.minQuantity}+ items → ${tr.bonusPercentage}% bonus`);
        });
    }
    console.log('');

    // Verify receipts by participant for January 2026
    console.log('🧾 January 2026 Receipt Breakdown:');
    for (const p of participants) {
        const receipts = await prisma.receipt.findMany({
            where: {
                participantId: p.id,
                date: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                }
            },
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        });

        console.log(`   ${p.firstname} ${p.lastname}:`);

        // Group by category
        const byCategory = {};
        let totalRevenue = 0;

        receipts.forEach(r => {
            const catName = r.product.category.name;
            if (!byCategory[catName]) {
                byCategory[catName] = {
                    count: 0,
                    revenue: 0,
                    mode: r.product.category.mode,
                    items: {}
                };
            }
            byCategory[catName].count++;
            byCategory[catName].revenue += r.price;
            totalRevenue += r.price;

            // For PER_ITEM mode, track individual products
            if (r.product.category.mode === 'PER_ITEM') {
                if (!byCategory[catName].items[r.product.name]) {
                    byCategory[catName].items[r.product.name] = 0;
                }
                byCategory[catName].items[r.product.name]++;
            }
        });

        for (const [catName, data] of Object.entries(byCategory)) {
            console.log(`     • ${catName} (${data.mode}): ${data.count} items, $${data.revenue.toFixed(2)}`);

            if (data.mode === 'PER_ITEM') {
                for (const [productName, count] of Object.entries(data.items)) {
                    console.log(`       - ${productName}: ${count}x`);
                }
            }
        }

        console.log(`     Total Revenue: $${totalRevenue.toFixed(2)}\n`);
    }

    // Verify forecast
    console.log('📈 Forecast:');
    const forecast = await prisma.forecast.findFirst({
        where: {
            month: 1,
            year: 2026
        }
    });

    if (forecast) {
        const requiredRevenue = forecast.targetAmount * forecast.threshold;
        console.log(`   • Target: $${forecast.targetAmount.toFixed(2)}`);
        console.log(`   • Threshold: ${(forecast.threshold * 100).toFixed(0)}%`);
        console.log(`   • Required Revenue: $${requiredRevenue.toFixed(2)}\n`);
    }

    // Calculate total revenue for January 2026
    const allReceipts = await prisma.receipt.findMany({
        where: {
            date: {
                gte: new Date(2026, 0, 1),
                lt: new Date(2026, 1, 1)
            }
        }
    });

    const totalRevenue = allReceipts.reduce((sum, r) => sum + r.price, 0);
    console.log('💰 Total Revenue (January 2026):');
    console.log(`   • $${totalRevenue.toFixed(2)}`);

    if (forecast) {
        const requiredRevenue = forecast.targetAmount * forecast.threshold;
        const meetsThreshold = totalRevenue >= requiredRevenue;
        console.log(`   • Meets ${(forecast.threshold * 100)}% threshold: ${meetsThreshold ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n✅ Verification complete!');
}

verifyData()
    .catch((e) => {
        console.error('❌ Error verifying data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
