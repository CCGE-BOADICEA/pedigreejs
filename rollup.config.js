import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';
import { eslint } from "rollup-plugin-eslint";


export default {
  input: 'es/index.js',
  plugins: [
	    eslint({
	    	include: 'es/**'
	    }),
	    babel({ babelHelpers: 'bundled' })
	  ],
  output: [{
	    name: 'pedigreejs',
	    file: 'build/js/pedigreejs.js',
	    format: 'iife',
	    sourcemap: 'inline'
	  },
	  {
		name: 'pedigreejs',
	    file: 'build/js/pedigreejs.min.js',
	    format: 'iife',
	    name: 'version',
	    plugins: [terser()]
	  }
  ]
};
