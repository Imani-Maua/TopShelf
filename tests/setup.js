// Test setup file - runs before all tests
// This is useful for global test configuration

// Set required environment variables for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Increase timeout for database operations
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };
