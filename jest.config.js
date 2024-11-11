module.exports = {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text'],
    collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/vendor/**'],
};
