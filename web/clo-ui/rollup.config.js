import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
// import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postCSS from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

const conf = {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/cjs/index.js',
      format: 'cjs',
    },
    {
      file: './dist/esm/index.js',
      format: 'es',
    },
  ],
  external: [...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    // peerDepsExternal(),
    nodeResolve(),
    commonjs(),
    typescript({
      typescript: require('typescript'),
    }),
    postCSS({
      plugins: [require('autoprefixer')],
    }),
    copy({
      targets: [
        {
          src: 'src/styles/*',
          dest: 'dist/styles',
        },
        {
          src: 'src/hooks/*',
          dest: 'dist/hooks',
        },
      ],
    }),
    terser(),
  ],
};

export default conf;
