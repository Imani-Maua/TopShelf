const formatDataForCalculation = (receipts, mode, tiers) => {
        if (mode === 'PER CATEGORY') {
            return {
                quantity: receipts.length,
                revenue: receipts.reduce((sum, r) => sum + r.price, 0),
                tier: this.getApplicableTier(receipts.length, tiers)
            };
        }

        if (mode === 'PER ITEM') {
            const salesMap = {};
            for (const receipt of receipts) {
                const name = receipt.product.name;
                if (!salesMap[name]) salesMap[name] = { quantity: 0, revenue: 0 };
                salesMap[name].quantity += 1;
                salesMap[name].revenue += receipt.price;
            }
            return Object.values(salesMap).map(sale => ({
                ...sale,
                tier: this.getApplicableTier(sale.quantity, tiers)
            }));
        }

        return [];
    }

const getApplicableTier = (quantity, tiers) =>{
         return [...tiers]
            .sort((a, b) => a.minQuantity - b.minQuantity)
            .filter(t => quantity >= t.minQuantity)
            .at(-1) ?? null;
    }

module.exports = {
   formatDataForCalculation,
    getApplicableTier
};