import config from "../../eslint.config.js";
import tseslint from "typescript-eslint";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ["plugin:react/recommended"]: eslintPluginReact,
      ["plugin:react-hooks/recommended"]: eslintPluginReactHooks,
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
  },

  /*
    We configure the global ignores pattern rulerecord config below. (equivalient to the old .eslintignore)
    Only ignores is allow inside the object below, otherwise it will not be treated as a global ignore.
  */
  {
    ignores: [
      // We ignore json files, these will be correctly formatted by prettier anyways.
      // "*.json",
      // We ignore the snarks folder which will be moved under ./packages/snarks
      "src/Shared/snarks/*",
      "vite.config.ts",
      "src/Backend/Plugins/minimapSpawn.js",
      "dist/*",
      "public/*",
      "postcss.config.js",
      "tailwind.config.js",
    ],
  },
];
