module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "d3": true,
        "canvg": true
    },
    "parser": "@babel/eslint-parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
	"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
	"no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
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
};
