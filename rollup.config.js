import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';
import { eslint } from "rollup-plugin-eslint";
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'es/index.js',
  plugins: [
	    eslint({
	    	include: 'es/**'
	    }),
	    babel({ babelHelpers: 'bundled' }),
	    postcss({ extract: true, minimize: true })
	  ],
  output: [{
	    name: 'pedigreejs',
	    file: 'build/pedigreejs.js',
	    format: 'iife',
	    sourcemap: 'inline'
	  },
	  {
		name: 'pedigreejs',
	    file: 'build/pedigreejs.min.js',
	    format: 'iife',
	    plugins: [terser()]
	  }
  ]
};
