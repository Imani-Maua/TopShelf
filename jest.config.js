module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '!src/**/*.js',
        'core/**/*.js',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    testTimeout: 15000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
