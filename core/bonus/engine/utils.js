const validateTransformInput =(rawData, index) => {
     // 1. Extract Fields (Flexible mapping)
        // We trim() to remove accidental spaces like " steak"
        const seller = rawData.seller?.trim();
        const item = rawData.item?.trim();
        const quantity = rawData.quantity;
        const price = rawData.price;
        const date = rawData.date;

        // 2. Check Existence
        if (!seller || !item || !quantity || !price || !date) {
            throw new Error(`Missing required fields at row ${index}`);
        }

        // 3. Type Conversion (Strings -> Numbers/Dates)
        const parsedQty = parseInt(quantity, 10);
        const parsedPrice = parseFloat(price);
        const parsedDate = new Date(date);

        // 4. Logical Validation
        if (isNaN(parsedQty) || parsedQty <= 0) {
            throw new Error(`Invalid Quantity: ${quantity}`);
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new Error(`Invalid Price: ${price}`);
        }
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid Date: ${date}`);
        }

        // 5. Return Clean Data Structure (Matches our Prisma Schema)
        return {
            sellerName: seller, // We will map this to an ID later in the Service
            itemName: item,
            quantity: parsedQty,
            price: parsedPrice,
            saleDate: parsedDate
        };
}

module.exports = {validateTransformInput};