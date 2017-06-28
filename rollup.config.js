import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';

export default {
    entry: 'dist/prophecy.js',
    dest: 'prophecy-dist.js',
    sourceMap: true,
    moduleName: 'Prophecy',
    format: 'umd',
    plugins: [
        resolve(),
        commonjs({}),
        uglify({}, minify)
    ]
};