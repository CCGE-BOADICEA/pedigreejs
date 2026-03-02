import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';

const version = process.env.npm_package_version;

export default {
  input: 'es/index.js',

  external: ['jquery', 'd3'],

  plugins: [
    postcss({
      extract: true,
      minimize: true
    })
  ],

  output: [
    {
      file: `build/pedigreejs.es.${version}.js`,
      format: 'es',
      sourcemap: true
    },
    {
      file: `build/pedigreejs.es.${version}.min.js`,
      format: 'es',
      sourcemap: true,
      plugins: [terser()]
    }
  ]
};
