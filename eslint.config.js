import eslintjs from "@eslint/js";
// import eslintPluginNoOnlyTests from "eslint-plugin-no-only-tests";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import eslintPluginRegexp from "eslint-plugin-regexp";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      // Objects that should be added to the global scope during linting.
      globals: {
        // @see https://eslint.org/docs/latest/use/configure/language-options#predefined-global-variables
        ...globals.browser,
        ...globals.es2016,
        // TODO: Add mocha when we enable tests
        // ...globals.mocha,
        ...globals.node,

        // Turn off these globals
        globalThis: false,
        loadJS: false,
      },
    },
    plugins: {
      // order matters
      // ["no-only-tests"]: eslintPluginNoOnlyTests,
      ["unicorn"]: eslintPluginUnicorn,
      ["@typescript-eslint"]: tseslint.plugin,
      ["simple-import-sort"]: eslintPluginSimpleImportSort,
      // ["regexp"]: eslintPluginRegexp,
    },
  },
  eslintjs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enable eslint rules
      // https://eslint.org/docs/latest/rules/
      ["curly"]: 2,
      "no-restricted-globals": ["error", "history", "location", "name"],
      "no-nested-ternary": "error",
      // "max-params": ["error", 4],
      "prefer-const": ["error", { destructuring: "all" }],
      "require-await": "warn",

      // We disable the following eslint rules so that typescript-eslint variant for the rules
      // are used instead
      "no-unused-expressions": "off",
      "no-unused-vars": "off", // covered by @typescript-eslint/no-unused-vars
      "no-var": "off", // covered by @typescript-eslint/no-var-requires
      "no-shadow": "off", // covered by @typescript-eslint/no-shadow

      // Enable TypeScript Eslint rules
      // https://typescript-eslint.io/rules/
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      // TODO: Enable explicit-module-boundary-types rule for TS files only
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-nocheck": "allow-with-description",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          // @see https://typescript-eslint.io/rules/explicit-function-return-type/
          /* Whether to allow arrow functions that start with the `void` keyword. */
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          /* Whether to ignore function expressions (functions which are not part of a declaration). */
          allowExpressions: true,
          /* Whether to ignore functions immediately returning another function expression. */
          allowHigherOrderFunctions: true,
          /* Whether to ignore type annotations on the variable of function expressions. */
          allowTypedFunctionExpressions: true,
          /* Whether to ignore arrow functions immediately returning a `as const` value. */
          allowDirectConstAssertionInArrowFunctions: true,
          /* Whether to ignore functions that don't have generic type parameters. */
          allowFunctionsWithoutTypeParameters: true,
          /* An array of function/method names that will not have their arguments or return values checked. */
          allowedNames: [],
          /* Whether to ignore immediately invoked function expressions (IIFEs). */
          allowIIFEs: true,
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      // @see https://typescript-eslint.io/rules/no-unused-vars/
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-shadow": [
        "warn",
        {
          // @see https://eslint.org/docs/latest/rules/no-shadow-restricted-names
          ignoreOnInitialization: true,
          ignoreTypeValueShadow: true,
        },
      ],

      // Enable no-only-tests rule
      // "no-only-tests/no-only-tests": "warn",

      // Enable simple-import-sort rules
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",

      // Enable unicorn rules:
      // @see https://github.com/sindresorhus/eslint-plugin-unicorn
      // "unicorn/explicit-length-check": "error",
      // "unicorn/no-array-for-each": "error",
      // "unicorn/no-array-reduce": "error",
      // "unicorn/no-invalid-remove-event-listener": "error",

      // Enable regexp rules
      // Avoids unsafe backtracking patterns in regular expressions
      // @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-backtracking.html
      // "regexp/no-super-linear-backtracking": "error",
    },
  },

  // As recommended by prettier
  // https://github.com/prettier/eslint-plugin-prettier?tab=readme-ov-file#configuration-new-eslintconfigjs
  eslintPluginPrettierRecommended,

  /**
   * Apply rules for following file types
   */
  {
    files: ["**/*.{ts,tsx,js,json}"],
  },

  /*
    We configure the global ignores pattern rulerecord config below. (equivalient to the old .eslintignore)
    Only ignores is allow inside the object below, otherwise it will not be treated as a global ignore.
  */
  {
    ignores: [
      "**/node_modules/*",
      "**/build/*",
      "**/package.json",
      "**/tsconfig.json",
      "**/renovate.json",
      "**/eslint.config.js",
      "**/.stylelintrc.cjs",
      "**/embedded_plugins/**",
    ],
  },
];
