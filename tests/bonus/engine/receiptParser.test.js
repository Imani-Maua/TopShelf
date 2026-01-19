const fs = require('fs');
const path = require('path');
const ReceiptParser = require('../../../core/bonus/engine/receiptParser');


jest.mock('../../../core/bonus/engine/utils', () => jest.fn());

const validateTransformInput = require('../../../core/bonus/engine/utils');

describe('ReceiptParser', () => {
    const tmpFile = path.join(__dirname, 'test.csv');
    let parser;

    beforeEach(() => {
        parser = new ReceiptParser();
        validateTransformInput.mockReset();
    });

    afterEach(() => {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    test('parses valid CSV rows successfully', async () => {
        fs.writeFileSync(
            tmpFile,
            'seller,item,quantity,price,date\nAlice,steak,2,10,2026-01-19'
        );

        validateTransformInput.mockReturnValue({
            sellerName: 'Alice',
            itemName: 'steak',
            quantity: 2,
            price: 10,
            saleDate: new Date('2026-01-19')
        });

        const result = await parser.parse(tmpFile);

        expect(result.validRecords).toHaveLength(1);
        expect(result.errors).toHaveLength(0);
        expect(validateTransformInput).toHaveBeenCalledTimes(1);
    });

    test('captures invalid rows without crashing', async () => {
        fs.writeFileSync(
            tmpFile,
            'seller,item,quantity,price,date\nAlice,steak,2,10,2026-01-19\nBob,,,-1,invalid'
        );

        validateTransformInput
            .mockReturnValueOnce({ sellerName: 'Alice' })
            .mockImplementationOnce(() => {
                throw new Error('Invalid row');
            });

        const result = await parser.parse(tmpFile);

        expect(result.validRecords).toHaveLength(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
            row: 2,
            message: 'Invalid row'
        });
    });

    test('returns empty arrays for empty CSV', async () => {
        fs.writeFileSync(tmpFile, 'seller,item,quantity,price,date\n');

        const result = await parser.parse(tmpFile);

        expect(result.validRecords).toEqual([]);
        expect(result.errors).toEqual([]);
    });

    test('throws on unsupported file type', async () => {
        await expect(
            parser.parse('file.xml', 'xml')
        ).rejects.toThrow(/Unsupported file type/);
    });
});

