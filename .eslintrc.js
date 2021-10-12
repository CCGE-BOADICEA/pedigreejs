export default {
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
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
	"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
	"no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
};
