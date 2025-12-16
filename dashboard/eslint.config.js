const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
    js.configs.recommended,
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
        },
        rules: {
            ...(react.configs.recommended && react.configs.recommended.rules
                ? react.configs.recommended.rules
                : {}),
            ...(reactHooks.configs.recommended && reactHooks.configs.recommended.rules
                ? reactHooks.configs.recommended.rules
                : {}),
            "react/react-in-jsx-scope": "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        ignores: ["dist/**"],
    },
];
