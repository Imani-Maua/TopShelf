const ReceiptAggregator = require('/domain/ReceiptAggregator');


describe('ReceiptAggregator', ()=> {
    let aggregator;

    const upsellCatalog = {
        steak: ['ribeye', 'wagyu'],
        cocktail: ['negroni', 'martini']
    };

    beforeEach(()=>{
        aggregator = new ReceiptAggregator(upsellCatalog);
    });

    test('ignores non-upsell items', () => {
        aggregator.addReceipt({
            seller: 'Alice',
            category: 'dessert',
            item: 'ice cream', 
            price: 10

        });

        expect(aggregator.getAggregatedData()).toEqual({});

    });


    test('aggregates quantity and revenue per item', ()=>{

        aggregator.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'ribeye',
            price: 50
        });

        aggregator.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'ribeye',
            price: 50
        });

        expect(aggregator.getAggregatedData()).toEqual({
            Alice:{
                steak:{
                    ribeye: {
                        quantity: 2,
                        revenue: 100
                    }
                }
            }
        });
    });

    test('separates different items in the same category', ()=>{
         aggregator.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'ribeye',
            price: 50
        });

         aggregator.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'wagyu',
            price: 150
        });

        expect(aggregator.getAggregatedData()).toEqual({
            Alice:{
                steak: {
                    ribeye: {quantity: 1, revenue: 50},
                    wagyu: {quantity: 1, revenue: 150}
                }
            }
        });
    });

    test('separate different sellers', ()=>{
        aggregator.addReceipt({
            seller: 'Alice',
            category: 'steak',
            item: 'ribeye',
            price: 50
        });

        aggregator.addReceipt({
            seller: 'Bob',
            category: 'steak',
            item: 'ribeye',
            price: 50
        });

        expect(aggregator.getAggregatedData()).toEqual({
            Alice:{
                steak: {
                    ribeye: {quantity: 1, revenue: 50}
                }
            },
            Bob:{
                steak: {
                    ribeye: {quantity: 1, revenue: 50}
                }
            }
        });
    });
})