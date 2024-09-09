module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "../../.eslintrc.cjs",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  // needed to work with the @typescript-eslint/prefer-nullish-coalescing rules
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
  ignorePatterns: [
    // We ignore the current file because it's a cjs file
    ".eslintrc.cjs",
    // We ignore json files, these will be correctly formatted by prettier anyways.
    // "*.json",
    // We ignore the snarks folder which will be moved under ./packages/snarks
    "src/Shared/snarks/*",
  ],
  plugins: ["react", "react-hooks"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    // "import/order": [
    //   "error",
    //   {
    //     groups: ["builtin", "external", "internal"],
    //     "newlines-between": "always",
    //     alphabetize: {
    //       order: "asc",
    //       caseInsensitive: false,
    //     },
    //   },
    // ],
  },
};
