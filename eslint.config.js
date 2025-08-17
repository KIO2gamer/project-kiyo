const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                fetch: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn"],
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error",
        },
    },
    {
        files: ["public/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        ignores: ["node_modules/", "logs/", "*.min.js"],
    },
];
