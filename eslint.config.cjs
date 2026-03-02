// eslint.config.cjs

const js = require("@eslint/js");
const globals = require("globals");
const babelParser = require("@babel/eslint-parser");

module.exports = [

  // Base recommended rules (equivalent to "eslint:recommended")
  js.configs.recommended,

  {
    files: ["es/**/*.js"],

    languageOptions: {
      parser: babelParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        requireConfigFile: false
      },

      globals: {
        ...globals.browser,
        ...globals.es2021,

        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
        d3: "readonly",
        canvg: "readonly",
        $: "readonly"
      }
    },

    rules: {
      "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_"}],
      eqeqeq: ["error", "smart"],
      "no-mixed-operators": "error",
      "no-cond-assign": "error",
      "no-loop-func": "error",
      "no-throw-literal": "error",
      "no-new-object": "error",
      "no-useless-concat": "error",
      "no-lone-blocks": "error",
      "no-empty": "error"
    }
  }
];
