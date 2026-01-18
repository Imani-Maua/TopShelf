const fs = require('fs');
const csv = require('csv-parser');

/**
 * ReceiptParser - The Gateway for file uploads.
 * 
 * DESIGN:
 * This class is designed to be extensible. Currently, it supports CSV.
 * In the future, we can add methods like `parseExcel` or `parseXML` 
 * and switch based on fileType.
 */
class ReceiptParser {

    /**
     * Main entry point. Determines how to parse the file based on type.
     * 
     * @param {string} filePath - Path to the file
     * @param {string} fileType - 'csv', 'json', etc. (default 'csv')
     */
    async parse(filePath, fileType = 'csv') {
        if (fileType.toLowerCase() === 'csv') {
            return this.#parseCSV(filePath);
        }

        // Future extension points:
        // if (fileType === 'excel') return this.#parseExcel(filePath);
        
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    /**
     * CSV Parsing Strategy
     * Reads a CSV stream and converts it to clean objects.
     */
    async #parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            const validRecords = [];
            const errors = [];
            let rowNumber = 0;

            // Create a read stream (efficient for large files)
            fs.createReadStream(filePath)
                .pipe(csv()) // Pipe strictly for CSVs
                .on('data', (row) => {
                    rowNumber++;
                    try {
                        // Transform Raw Row -> Clean Object
                        const record = this.#validateAndTransform(row, rowNumber);
                        validRecords.push(record);
                    } catch (error) {
                        // Capture bad rows without crashing
                        errors.push({
                            row: rowNumber,
                            data: row,
                            message: error.message
                        });
                    }
                })
                .on('end', () => {
                    console.log(`Parsing complete. Processed ${rowNumber} rows.`);
                    resolve({ validRecords, errors });
                })
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Common Validation Logic
     * reliable, regardless of whether data came from CSV, Excel, or XML.
     * 
     * @param {Object} rawData - The raw row/item from the file
     * @param {number} index - Line number for error reporting
     */
    #validateAndTransform(rawData, index) {
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
}

module.exports = ReceiptParser;