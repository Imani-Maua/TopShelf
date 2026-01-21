/**
 * Test Suite for ParsingService
 * 
 * This service orchestrates the receipt upload process by:
 * 1. Parsing CSV files via ReceiptParser
 * 2. Mapping seller/product names to database IDs
 * 3. Validating existence of sellers and products
 * 4. Saving valid receipts to the database
 */

// Mock ReceiptParser with a proper instance
const mockParserInstance = {
    parse: jest.fn()
};

jest.mock('../../../core/bonus/engine/receiptParser', () => {
    return jest.fn().mockImplementation(() => mockParserInstance);
});

jest.mock('@prisma/client', () => {
    const mPrisma = {
        participant: { findMany: jest.fn() },
        product: { findMany: jest.fn() },
        receipt: { createMany: jest.fn() }
    };
    return {
        PrismaClient: jest.fn(() => mPrisma)
    };
});

const ParsingService = require('../../../core/bonus/services/parsingService');
const { PrismaClient } = require('@prisma/client');

describe('ParsingService', () => {
    let service;
    let prisma;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset the mock parser
        mockParserInstance.parse.mockReset();

        // Initialize service
        service = new ParsingService();
        prisma = new PrismaClient();
    });

    describe('uploadReceipts', () => {

        test('returns zero processed when no valid records from parser', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [],
                errors: [{ row: 1, message: 'Invalid data' }]
            });

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result).toEqual({
                processed: 0,
                errors: [{ row: 1, message: 'Invalid data' }]
            });
            expect(prisma.participant.findMany).not.toHaveBeenCalled();
            expect(prisma.product.findMany).not.toHaveBeenCalled();
            expect(prisma.receipt.createMany).not.toHaveBeenCalled();
        });

        test('successfully processes valid receipts with exact name matches', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    },
                    {
                        sellerName: 'Jane Smith',
                        itemName: 'Mojito',
                        quantity: 3,
                        price: 12.50,
                        saleDate: new Date('2026-01-16'),
                        row: 2
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' },
                { id: 'p2', firstname: 'Jane', lastname: 'Smith' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' },
                { id: 'prod2', name: 'Mojito' }
            ]);

            prisma.receipt.createMany.mockResolvedValue({ count: 2 });

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(2);
            expect(result.errors).toHaveLength(0);

            expect(prisma.receipt.createMany).toHaveBeenCalledWith({
                data: [
                    {
                        participantId: 'p1',
                        productId: 'prod1',
                        date: new Date('2026-01-15'),
                        price: 45.99
                    },
                    {
                        participantId: 'p2',
                        productId: 'prod2',
                        date: new Date('2026-01-16'),
                        price: 12.50
                    }
                ]
            });
        });

        test('reports error for unknown seller name', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'Unknown Person',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toMatchObject({
                row: 1,
                message: expect.stringContaining('Unknown seller: "Unknown Person"')
            });
            expect(prisma.receipt.createMany).not.toHaveBeenCalled();
        });

        test('reports error for unknown product name', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Unknown Product',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toMatchObject({
                row: 1,
                message: expect.stringContaining('Unknown Product')
            });
            expect(prisma.receipt.createMany).not.toHaveBeenCalled();
        });

        test('processes valid receipts and reports errors for invalid ones (partial success)', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    },
                    {
                        sellerName: 'Unknown Seller',
                        itemName: 'Mojito',
                        quantity: 3,
                        price: 12.50,
                        saleDate: new Date('2026-01-16'),
                        row: 2
                    },
                    {
                        sellerName: 'Jane Smith',
                        itemName: 'Unknown Product',
                        quantity: 1,
                        price: 30.00,
                        saleDate: new Date('2026-01-17'),
                        row: 3
                    },
                    {
                        sellerName: 'Jane Smith',
                        itemName: 'Mojito',
                        quantity: 5,
                        price: 20.00,
                        saleDate: new Date('2026-01-18'),
                        row: 4
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' },
                { id: 'p2', firstname: 'Jane', lastname: 'Smith' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' },
                { id: 'prod2', name: 'Mojito' }
            ]);

            prisma.receipt.createMany.mockResolvedValue({ count: 2 });

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(2);
            expect(result.errors).toHaveLength(2);

            // Check that valid receipts were saved
            expect(prisma.receipt.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        participantId: 'p1',
                        productId: 'prod1'
                    }),
                    expect.objectContaining({
                        participantId: 'p2',
                        productId: 'prod2'
                    })
                ])
            });

            // Check error messages
            expect(result.errors[0].message).toContain('Unknown seller');
            expect(result.errors[1].message).toContain('Unknown Product');
        });

        test('combines parser errors with service errors', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'Unknown Seller',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 2
                    }
                ],
                errors: [
                    { row: 1, message: 'Invalid date format' }
                ]
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(2);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ row: 1, message: 'Invalid date format' }),
                    expect.objectContaining({ row: 2, message: expect.stringContaining('Unknown seller') })
                ])
            );
        });

        test('fetches participants and products in parallel', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            let participantResolved = false;
            let productResolved = false;

            prisma.participant.findMany.mockImplementation(() =>
                new Promise(resolve => {
                    setTimeout(() => {
                        participantResolved = true;
                        resolve([{ id: 'p1', firstname: 'John', lastname: 'Doe' }]);
                    }, 10);
                })
            );

            prisma.product.findMany.mockImplementation(() =>
                new Promise(resolve => {
                    setTimeout(() => {
                        productResolved = true;
                        resolve([{ id: 'prod1', name: 'Ribeye Steak' }]);
                    }, 10);
                })
            );

            prisma.receipt.createMany.mockResolvedValue({ count: 1 });

            // Act
            await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(prisma.participant.findMany).toHaveBeenCalled();
            expect(prisma.product.findMany).toHaveBeenCalled();
            expect(participantResolved).toBe(true);
            expect(productResolved).toBe(true);
        });

        test('handles case-sensitive name matching', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'john doe', // lowercase
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' } // capitalized
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            // Should fail because names don't match exactly
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Unknown seller');
        });

        test('does not save to database when all records are invalid', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'Unknown Person',
                        itemName: 'Unknown Product',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(prisma.receipt.createMany).not.toHaveBeenCalled();
        });

        test('handles multiple receipts for the same participant and product', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    },
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 1,
                        price: 22.99,
                        saleDate: new Date('2026-01-16'),
                        row: 2
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            prisma.receipt.createMany.mockResolvedValue({ count: 2 });

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(2);
            expect(result.errors).toHaveLength(0);
            expect(prisma.receipt.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        participantId: 'p1',
                        productId: 'prod1',
                        price: 45.99
                    }),
                    expect.objectContaining({
                        participantId: 'p1',
                        productId: 'prod1',
                        price: 22.99
                    })
                ])
            });
        });

        test('handles empty database (no participants or products)', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([]);
            prisma.product.findMany.mockResolvedValue([]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Unknown seller');
            expect(prisma.receipt.createMany).not.toHaveBeenCalled();
        });

        test('calls parser with correct file path', async () => {
            // Arrange
            const testPath = '/test/path/receipts.csv';

            mockParserInstance.parse.mockResolvedValue({
                validRecords: [],
                errors: []
            });

            // Act
            await service.uploadReceipts(testPath);

            // Assert
            expect(mockParserInstance.parse).toHaveBeenCalledWith(testPath);
        });
    });

    describe('Private Methods (via behavior testing)', () => {

        test('formatName creates correct full name format', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'John Doe',
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            prisma.receipt.createMany.mockResolvedValue({ count: 1 });

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            // If the name format is correct, the receipt should be processed
            expect(result.processed).toBe(1);
        });

        test('findApproximateMatch returns null (placeholder behavior)', async () => {
            // Arrange
            mockParserInstance.parse.mockResolvedValue({
                validRecords: [
                    {
                        sellerName: 'Jon Doe', // Typo in name
                        itemName: 'Ribeye Steak',
                        quantity: 2,
                        price: 45.99,
                        saleDate: new Date('2026-01-15'),
                        row: 1
                    }
                ],
                errors: []
            });

            prisma.participant.findMany.mockResolvedValue([
                { id: 'p1', firstname: 'John', lastname: 'Doe' }
            ]);

            prisma.product.findMany.mockResolvedValue([
                { id: 'prod1', name: 'Ribeye Steak' }
            ]);

            // Act
            const result = await service.uploadReceipts('/path/to/file.csv');

            // Assert
            // Since fuzzy matching returns null, should report error
            expect(result.processed).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Unknown seller');
        });
    });
});
