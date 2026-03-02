// rollup.config.cjs
const { babel } = require('@rollup/plugin-babel');
const terser = require('@rollup/plugin-terser');
const { eslint } = require('rollup-plugin-eslint');
const postcss = require('rollup-plugin-postcss');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const pkg = require('./package.json');


const version = pkg.version;

// Determine format from environment variable
const format = process.env.FORMAT || 'iife';
const isMin = process.env.MIN === 'true'; // optional flag for minified
const d = new Date();
let year = d.getFullYear();

const banner = `/*!
 * © ${year} University of Cambridge
 * pedigreejs v${version}
 * ${pkg.homepage}
 * License: ${pkg.license}
 */`;

// Determine output filename
let file;
if (format === 'iife') {
  file = isMin
    ? `build/pedigreejs.v${version}.min.js`  // minified
    : `build/pedigreejs.v${version}.js`;     // unminified
} else if (format === 'es') {
  file = isMin
    ? `build/pedigreejs.v${version}.es.min.js`
    : `build/pedigreejs.v${version}.es.js`
} else if (format === 'cjs') {
  file = `build/pedigreejs.v${version}.cjs.js`;
}

const externalLibs = ['jquery', 'd3'];

module.exports = {
  input: 'es/index.js',
  external: externalLibs,

  output: {
    file,
    format,
    name: 'pedigreejs',
    sourcemap: true,
    banner,

    // REQUIRED for IIFE/UMD only
    globals: {
      jquery: '$',
      d3: 'd3'
    }
  },

  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),

    ...(format === 'iife' && !isMin ? [eslint({ include: 'es/**' })] : []),

    babel({ babelHelpers: 'bundled', sourceMap: true }),
    postcss({ extract: true, minimize: true }),
    ...(isMin ? [terser()] : [])
  ]
};
