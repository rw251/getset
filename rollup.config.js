import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import rimraf from 'rimraf';
import { terser } from 'rollup-plugin-terser';
import rollbarDeploy from 'rollup-plugin-rollbar-deploy';
import rollbarSourcemaps from 'rollup-plugin-rollbar-sourcemaps';
import { execSync } from 'child_process';
import createHTMLPlugin from './lib/create-html';
import { version } from './package.json';

const { rollbarServerToken } = require('./src/server/config.js');

const SOURCE_VERSION =
  process.env.SOURCE_VERSION || execSync('git rev-parse --short HEAD').toString();
const USER = execSync('whoami').toString();

const distDir = 'dist';
// Remove ./dist
rimraf.sync(distDir);

function buildConfig({ watch } = {}) {
  const isDev = watch;

  return {
    input: {
      main: 'src/client/index.js',
      // sw:
    },
    output: {
      dir: distDir,
      format: 'iife',
      sourcemap: watch || 'hidden',
      entryFileNames: '[name]-[hash].js',
      chunkFileNames: '[name]-[hash].js',
    },
    watch: { clearScreen: false },
    plugins: [
      // allows import *.css
      postcss(),

      // resolves in-built node packages like https / fs etc..
      nodeResolve({
        preferBuiltins: true,
        mainFields: ['browser', 'module', 'main'],
      }),

      commonjs({ namedExports: { 'src/server/config.js': ['rollbarClientToken'] } }), // allows import to work with commonjs modules that do a module.exports
      globals(),
      builtins(),
      babel({ exclude: 'node_modules/**' }),
      !isDev && terser(), // uglify the code if not dev mode
      createHTMLPlugin({ isDev }), // create the index.html
      copy({
        targets: [{ src: 'src/client/assets/**/*', dest: distDir }],
      }),
      !isDev &&
        rollbarSourcemaps({
          accessToken: rollbarServerToken,
          baseUrl: '//getset.ga/',
          version,
        }), // upload rollbar source maps if production build
      !isDev &&
        rollbarDeploy({
          accessToken: rollbarServerToken,
          revision: SOURCE_VERSION,
          environment: 'production',
          localUsername: USER,
        }), // notify Rollbar of a deployment if production build
    ].filter((item) => item), // filter out unused plugins by filtering out false and null values
  };
}

export default function ({ watch }) {
  return [buildConfig({ watch })];
}
