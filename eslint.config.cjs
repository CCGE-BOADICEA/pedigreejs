// eslint.config.cjs

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,

  {
    files: ["es/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,
        d3: "readonly",
        $: "readonly"
      }
    },

    rules: {
      "no-mixed-spaces-and-tabs": "error",
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
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
