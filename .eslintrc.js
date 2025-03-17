module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended', // This will enable eslint-plugin-prettier and eslint-config-prettier
    ],
    parserOptions: {
        ecmaVersion: 2021,
    },
    plugins: ['prettier'],
};
