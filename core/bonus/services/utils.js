const formatDataForCalculation = (receipts, mode, tiers) => {
    if (mode === 'PER_CATEGORY') {
        return {
            productName: null,  // Not applicable for category mode
            quantity: receipts.length,
            revenue: receipts.reduce((sum, receipt) => sum + receipt.price, 0),
            tier: getApplicableTier(receipts.length, tiers),
            products: receipts.map(receipt => receipt.product.name)  // List all products sold
        };
    }

    if (mode === 'PER_ITEM') {
        const salesMap = {};
        for (const receipt of receipts) {
            const name = receipt.product.name;
            if (!salesMap[name]) salesMap[name] = { quantity: 0, revenue: 0 };
            salesMap[name].quantity += 1;
            salesMap[name].revenue += receipt.price;
        }
        return Object.entries(salesMap).map(([productName, sale]) => ({
            productName,  // Include product name
            quantity: sale.quantity,
            revenue: sale.revenue,
            tier: getApplicableTier(sale.quantity, tiers)
        }));
    }

    return [];
}

const getApplicableTier = (quantity, tiers) => {
    return [...tiers]
        .sort((a, b) => a.minQuantity - b.minQuantity)
        .filter(t => quantity >= t.minQuantity)
        .at(-1) ?? null;
}

module.exports = {
    formatDataForCalculation,
    getApplicableTier
};