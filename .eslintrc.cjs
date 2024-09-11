module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "prettier",
    "simple-import-sort",
    // "eslint-plugin-import",
    // "eslint-plugin-unicorn",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    // "plugin:import/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    // curly: 2,
    "no-restricted-globals": ["error", "history", "location", "name"],
    // "no-nested-ternary": "error",
    // "max-params": ["error", 4],
    "prefer-const": ["error", { destructuring: "all" }],
    // "require-await": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
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
    "@typescript-eslint/no-var-requires": "warn",
    // we must turn off the js variants to leg the "@typescript-eslint/no-unused-vars" variant to run
    "no-unused-vars": "off",
    "no-var": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { vars: "all", args: "none", ignoreRestSiblings: true },
    ],

    // note we must disable no-shadow such that the typescript variant can run
    // "no-shadow": "off",
    // "@typescript-eslint/no-shadow": [
    //   "error",
    //   {
    //     // @see https://eslint.org/docs/latest/rules/no-shadow-restricted-names
    //     ignoreOnInitialization: true,
    //     ignoreTypeValueShadow: true,
    //   },
    // ],

    // "no-only-tests/no-only-tests": "error",
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
