import {babel} from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { eslint } from "rollup-plugin-eslint";
import postcss from 'rollup-plugin-postcss';
import sourcemaps from 'rollup-plugin-sourcemaps';

const version = process.env.npm_package_version;

export default {
  input: 'es/index.js',
  plugins: [
	  sourcemaps(),
	    eslint({
	    	include: 'es/**'
	    }),
	    babel({ babelHelpers: 'bundled', sourceMap: true, inputSourceMap: false }),
	    postcss({ extract: true, minimize: true })
	  ],
  output: [{
	    name: 'pedigreejs',
	    file: 'build/pedigreejs.'+version+'.js',
	    format: 'iife'
	  },
	  {
		name: 'pedigreejs',
	    file: 'build/pedigreejs.'+version+'.min.js',
	    format: 'iife',
	    plugins: [terser()],
	    sourcemap: true
	  }
  ]
};
