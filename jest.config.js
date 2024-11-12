module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text'],
    testResultsProcessor: 'jest-sonar-reporter',
    collectCoverageFrom: [
        '**/*.test.js',
        '!**/node_modules/**',
        '!**/vendor/**',
    ],
};
