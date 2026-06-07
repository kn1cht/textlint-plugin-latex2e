const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "jest.config.js",
      "husky.config.js",
      "lint-staged.config.js",
      "lib/**",
      "*.json",
      "node_modules/**",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: tseslint.configs.recommended.rules,
  },
  {
    files: ["test/**/*.ts"],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    files: ["**/*.js", "bin/tex2tast"],
    languageOptions: {
      ecmaVersion: 2015,
      globals: globals.node,
    },
  },
  prettier,
];
