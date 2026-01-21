const { validateTransformInput } = require('../../../core/bonus/engine/utils');

describe('validateTransformInput', () => {

    test('returns a normalized object for valid input', () => {
        const input = {
            seller: ' Alice ',
            item: ' steak ',
            quantity: '2',
            price: '10.50',
            date: '2026-01-19'
        };

        const result = validateTransformInput(input, 1);

        expect(result).toEqual({
            sellerName: 'Alice',
            itemName: 'steak',
            quantity: 2,
            price: 10.5,
            saleDate: new Date('2026-01-19')
        });
    });

    test('throws if any required field is missing', () => {
        const cases = [
            { item: 'steak', quantity: '1', price: '10', date: '2026-01-19' },
            { seller: 'Alice', quantity: '1', price: '10', date: '2026-01-19' },
            { seller: 'Alice', item: 'steak', price: '10', date: '2026-01-19' },
            { seller: 'Alice', item: 'steak', quantity: '1', date: '2026-01-19' },
            { seller: 'Alice', item: 'steak', quantity: '1', price: '10' }
        ];

        cases.forEach((input, i) => {
            expect(() =>
                validateTransformInput(input, i + 1)
            ).toThrow(/Missing required fields/);
        });
    });

    test('throws if quantity is invalid', () => {
        const cases = ['0', '-1', 'abc'];

        cases.forEach(qty => {
            expect(() =>
                validateTransformInput(
                    {
                        seller: 'Alice',
                        item: 'steak',
                        quantity: qty,
                        price: '10',
                        date: '2026-01-19'
                    },
                    1
                )
            ).toThrow(/Invalid Quantity/);
        });
    });

    test('throws if price is invalid', () => {
        const cases = ['-5', 'abc'];

        cases.forEach(price => {
            expect(() =>
                validateTransformInput(
                    {
                        seller: 'Alice',
                        item: 'steak',
                        quantity: '1',
                        price,
                        date: '2026-01-19'
                    },
                    1
                )
            ).toThrow(/Invalid Price/);
        });
    });

    test('throws if date is invalid', () => {
        expect(() =>
            validateTransformInput(
                {
                    seller: 'Alice',
                    item: 'steak',
                    quantity: '1',
                    price: '10',
                    date: 'not-a-date'
                },
                1
            )
        ).toThrow(/Invalid Date/);
    });

    test('preserves row index in error messages', () => {
        try {
            validateTransformInput({}, 42);
        } catch (error) {
            expect(error.message).toContain('42');
        }
    });

});
