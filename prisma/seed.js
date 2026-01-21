const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.receipt.deleteMany({});
    await prisma.bonusPayout.deleteMany({});
    await prisma.tierRule.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.forecast.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // 1. Create Participants
    console.log('👥 Creating participants...');
    const alice = await prisma.participant.create({
        data: {
            firstname: 'Alice',
            lastname: 'Johnson'
        }
    });

    const bob = await prisma.participant.create({
        data: {
            firstname: 'Bob',
            lastname: 'Smith'
        }
    });

    const charlie = await prisma.participant.create({
        data: {
            firstname: 'Charlie',
            lastname: 'Davis'
        }
    });

    const diana = await prisma.participant.create({
        data: {
            firstname: 'Diana',
            lastname: 'Martinez'
        }
    });
    console.log(`✅ Created 4 participants\n`);

    // 2. Create Categories
    console.log('📂 Creating categories...');
    const steaksCategory = await prisma.category.create({
        data: {
            name: 'High-End Steaks',
            mode: 'PER_ITEM'
        }
    });

    const cocktailsCategory = await prisma.category.create({
        data: {
            name: 'Cocktails',
            mode: 'PER_CATEGORY'
        }
    });

    const wineCategory = await prisma.category.create({
        data: {
            name: 'Wine',
            mode: 'PER_CATEGORY'
        }
    });
    console.log(`✅ Created 3 categories (1 PER_ITEM, 2 PER_CATEGORY)\n`);

    // 3. Create Products
    console.log('🍽️  Creating products...');

    // Steaks - PER_ITEM mode
    const ribeye = await prisma.product.create({
        data: { name: 'Ribeye Steak', price: 45.00, categoryId: steaksCategory.id }
    });
    const wagyu = await prisma.product.create({
        data: { name: 'Wagyu Steak', price: 85.00, categoryId: steaksCategory.id }
    });
    const filetMignon = await prisma.product.create({
        data: { name: 'Filet Mignon', price: 55.00, categoryId: steaksCategory.id }
    });
    const tbone = await prisma.product.create({
        data: { name: 'T-Bone Steak', price: 42.00, categoryId: steaksCategory.id }
    });
    const porterhouse = await prisma.product.create({
        data: { name: 'Porterhouse Steak', price: 52.00, categoryId: steaksCategory.id }
    });

    // Cocktails - PER_CATEGORY mode
    const martini = await prisma.product.create({
        data: { name: 'Martini', price: 14.00, categoryId: cocktailsCategory.id }
    });
    const mojito = await prisma.product.create({
        data: { name: 'Mojito', price: 12.00, categoryId: cocktailsCategory.id }
    });
    const oldFashioned = await prisma.product.create({
        data: { name: 'Old Fashioned', price: 15.00, categoryId: cocktailsCategory.id }
    });
    const margarita = await prisma.product.create({
        data: { name: 'Margarita', price: 13.00, categoryId: cocktailsCategory.id }
    });
    const manhattan = await prisma.product.create({
        data: { name: 'Manhattan', price: 14.00, categoryId: cocktailsCategory.id }
    });

    // Wines - PER_CATEGORY mode
    const cabernet = await prisma.product.create({
        data: { name: 'Cabernet Sauvignon', price: 35.00, categoryId: wineCategory.id }
    });
    const pinotNoir = await prisma.product.create({
        data: { name: 'Pinot Noir', price: 38.00, categoryId: wineCategory.id }
    });
    const chardonnay = await prisma.product.create({
        data: { name: 'Chardonnay', price: 32.00, categoryId: wineCategory.id }
    });
    const merlot = await prisma.product.create({
        data: { name: 'Merlot', price: 30.00, categoryId: wineCategory.id }
    });
    const sauvignonBlanc = await prisma.product.create({
        data: { name: 'Sauvignon Blanc', price: 28.00, categoryId: wineCategory.id }
    });
    console.log(`✅ Created 15 products (5 steaks, 5 cocktails, 5 wines)\n`);

    // 4. Create Tier Rules (monotonically increasing)
    console.log('📊 Creating tier rules...');

    // Steaks tier rules (PER_ITEM mode)
    await prisma.tierRule.create({
        data: {
            categoryId: steaksCategory.id,
            minQuantity: 3,
            bonusPercentage: 5.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: steaksCategory.id,
            minQuantity: 5,
            bonusPercentage: 10.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: steaksCategory.id,
            minQuantity: 8,
            bonusPercentage: 15.0
        }
    });

    // Cocktails tier rules (PER_CATEGORY mode)
    await prisma.tierRule.create({
        data: {
            categoryId: cocktailsCategory.id,
            minQuantity: 10,
            bonusPercentage: 5.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: cocktailsCategory.id,
            minQuantity: 20,
            bonusPercentage: 10.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: cocktailsCategory.id,
            minQuantity: 30,
            bonusPercentage: 15.0
        }
    });

    // Wine tier rules (PER_CATEGORY mode)
    await prisma.tierRule.create({
        data: {
            categoryId: wineCategory.id,
            minQuantity: 8,
            bonusPercentage: 5.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: wineCategory.id,
            minQuantity: 15,
            bonusPercentage: 12.0
        }
    });
    await prisma.tierRule.create({
        data: {
            categoryId: wineCategory.id,
            minQuantity: 25,
            bonusPercentage: 18.0
        }
    });
    console.log(`✅ Created 9 tier rules (3 per category)\n`);

    // 5. Create Receipts for January 2026
    console.log('🧾 Creating receipts for January 2026...');

    // Helper function to create dates in January 2026
    const janDate = (day) => new Date(2026, 0, day); // Month is 0-indexed

    // ALICE JOHNSON - Multi-category high performer
    // Steaks: 6 Ribeye (hits 5+ tier = 10%), 3 Wagyu (hits 3-4 tier = 5%)
    for (let i = 0; i < 6; i++) {
        await prisma.receipt.create({
            data: {
                participantId: alice.id,
                productId: ribeye.id,
                price: ribeye.price,
                date: janDate(2 + i)
            }
        });
    }
    for (let i = 0; i < 3; i++) {
        await prisma.receipt.create({
            data: {
                participantId: alice.id,
                productId: wagyu.id,
                price: wagyu.price,
                date: janDate(8 + i)
            }
        });
    }

    // Cocktails: 12 total (hits 10-19 tier = 5%)
    await prisma.receipt.create({ data: { participantId: alice.id, productId: martini.id, price: martini.price, date: janDate(3) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: martini.id, price: martini.price, date: janDate(4) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: mojito.id, price: mojito.price, date: janDate(5) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: mojito.id, price: mojito.price, date: janDate(6) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: oldFashioned.id, price: oldFashioned.price, date: janDate(7) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: oldFashioned.id, price: oldFashioned.price, date: janDate(10) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: margarita.id, price: margarita.price, date: janDate(11) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: margarita.id, price: margarita.price, date: janDate(12) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: manhattan.id, price: manhattan.price, date: janDate(13) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: manhattan.id, price: manhattan.price, date: janDate(14) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: martini.id, price: martini.price, date: janDate(15) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: mojito.id, price: mojito.price, date: janDate(16) } });

    // Wine: 10 total (hits 8-14 tier = 5%)
    await prisma.receipt.create({ data: { participantId: alice.id, productId: cabernet.id, price: cabernet.price, date: janDate(17) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: cabernet.id, price: cabernet.price, date: janDate(18) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: pinotNoir.id, price: pinotNoir.price, date: janDate(19) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: pinotNoir.id, price: pinotNoir.price, date: janDate(20) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: chardonnay.id, price: chardonnay.price, date: janDate(21) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: chardonnay.id, price: chardonnay.price, date: janDate(22) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: merlot.id, price: merlot.price, date: janDate(23) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: merlot.id, price: merlot.price, date: janDate(24) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: sauvignonBlanc.id, price: sauvignonBlanc.price, date: janDate(25) } });
    await prisma.receipt.create({ data: { participantId: alice.id, productId: sauvignonBlanc.id, price: sauvignonBlanc.price, date: janDate(26) } });

    console.log('  ✓ Alice: 31 receipts (multi-category)');

    // BOB SMITH - PER_CATEGORY specialist (Cocktails)
    // 25 cocktails total (hits 20-29 tier = 10%)
    for (let i = 0; i < 5; i++) {
        await prisma.receipt.create({ data: { participantId: bob.id, productId: martini.id, price: martini.price, date: janDate(2 + i) } });
    }
    for (let i = 0; i < 5; i++) {
        await prisma.receipt.create({ data: { participantId: bob.id, productId: mojito.id, price: mojito.price, date: janDate(7 + i) } });
    }
    for (let i = 0; i < 5; i++) {
        await prisma.receipt.create({ data: { participantId: bob.id, productId: oldFashioned.id, price: oldFashioned.price, date: janDate(12 + i) } });
    }
    for (let i = 0; i < 5; i++) {
        await prisma.receipt.create({ data: { participantId: bob.id, productId: margarita.id, price: margarita.price, date: janDate(17 + i) } });
    }
    for (let i = 0; i < 5; i++) {
        await prisma.receipt.create({ data: { participantId: bob.id, productId: manhattan.id, price: manhattan.price, date: janDate(22 + i) } });
    }

    console.log('  ✓ Bob: 25 receipts (PER_CATEGORY cocktails)');

    // CHARLIE DAVIS - PER_ITEM specialist (Steaks)
    // 8 Wagyu (hits 8+ tier = 15%), 4 Filet Mignon (hits 3-4 tier = 5%)
    for (let i = 0; i < 8; i++) {
        await prisma.receipt.create({
            data: {
                participantId: charlie.id,
                productId: wagyu.id,
                price: wagyu.price,
                date: janDate(2 + i * 2)
            }
        });
    }
    for (let i = 0; i < 4; i++) {
        await prisma.receipt.create({
            data: {
                participantId: charlie.id,
                productId: filetMignon.id,
                price: filetMignon.price,
                date: janDate(3 + i * 2)
            }
        });
    }

    console.log('  ✓ Charlie: 12 receipts (PER_ITEM steaks)');

    // DIANA MARTINEZ - Low performer (below thresholds)
    // 2 Steaks, 5 Cocktails, 3 Wines - all below minimum tiers
    await prisma.receipt.create({ data: { participantId: diana.id, productId: ribeye.id, price: ribeye.price, date: janDate(5) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: tbone.id, price: tbone.price, date: janDate(10) } });

    await prisma.receipt.create({ data: { participantId: diana.id, productId: martini.id, price: martini.price, date: janDate(6) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: mojito.id, price: mojito.price, date: janDate(7) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: margarita.id, price: margarita.price, date: janDate(8) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: oldFashioned.id, price: oldFashioned.price, date: janDate(9) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: manhattan.id, price: manhattan.price, date: janDate(11) } });

    await prisma.receipt.create({ data: { participantId: diana.id, productId: cabernet.id, price: cabernet.price, date: janDate(15) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: pinotNoir.id, price: pinotNoir.price, date: janDate(16) } });
    await prisma.receipt.create({ data: { participantId: diana.id, productId: chardonnay.id, price: chardonnay.price, date: janDate(17) } });

    console.log('  ✓ Diana: 10 receipts (low performer, below thresholds)');

    const totalReceipts = await prisma.receipt.count();
    console.log(`✅ Created ${totalReceipts} receipts total\n`);

    // 6. Create Forecast for January 2026
    console.log('📈 Creating forecast for January 2026...');
    await prisma.forecast.create({
        data: {
            month: 1,
            year: 2026,
            targetAmount: 50000.00,
            threshold: 0.90 // 90% threshold - need $45,000 to unlock bonuses
        }
    });
    console.log(`✅ Created forecast (target: $50,000, threshold: 90%)\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                  SEED SUMMARY                              ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 Test Period: January 2026');
    console.log('');
    console.log('👥 Participants:');
    console.log('   • Alice Johnson - Multi-category performer');
    console.log('   • Bob Smith - PER_CATEGORY specialist (Cocktails)');
    console.log('   • Charlie Davis - PER_ITEM specialist (Steaks)');
    console.log('   • Diana Martinez - Low performer (control)');
    console.log('');
    console.log('📂 Categories:');
    console.log('   • High-End Steaks (PER_ITEM) - 5 products, 3 tiers');
    console.log('   • Cocktails (PER_CATEGORY) - 5 products, 3 tiers');
    console.log('   • Wine (PER_CATEGORY) - 5 products, 3 tiers');
    console.log('');
    console.log('🧾 Receipts:');
    console.log('   • Alice: 31 receipts across all categories');
    console.log('   • Bob: 25 receipts (all cocktails)');
    console.log('   • Charlie: 12 receipts (steaks only)');
    console.log('   • Diana: 10 receipts (below thresholds)');
    console.log('   • Total: ' + totalReceipts + ' receipts');
    console.log('');
    console.log('📊 Expected Bonus Scenarios:');
    console.log('   ✓ Alice qualifies for bonuses from multiple categories');
    console.log('   ✓ Bob qualifies for PER_CATEGORY cocktail bonuses (10%)');
    console.log('   ✓ Charlie qualifies for PER_ITEM wagyu bonuses (15%)');
    console.log('   ✓ Diana receives $0 or minimal bonuses');
    console.log('');
    console.log('🎯 Forecast Target: $50,000 (90% threshold = $45,000)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
