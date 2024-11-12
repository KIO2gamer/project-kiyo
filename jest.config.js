module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text'],
    collectCoverageFrom: [
        '**/*.test.js',
        '!**/node_modules/**',
        '!**/vendor/**',
    ],
};
