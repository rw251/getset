// Custom rollup plugin for creating html pages
import { readFileSync } from 'fs';
import mustache from 'mustache';
import { findHashFromName } from './bundle-utils';
import { version } from '../package.json';

// oddly this needs to be relative to root
const { rollbarClientToken } = require('./src/server/config.js');

function generateShell(bundle, { templatePath, isDev, isError }) {
  const template = readFileSync(templatePath, 'utf8');
  const scriptFile = findHashFromName(bundle, 'main');
  const cssFile = scriptFile.replace('.js', '.css');
  return mustache.to_html(template, {
    isProduction: !isDev,
    isDev,
    rollbarClientToken,
    cssFile,
    scriptFile,
    title: 'Get Set',
    version,
    isError,
  });
}

export default function createHTMLPlugin({ isDev }) {
  const templatePath = 'src/client/index.mustache';
  return {
    name: 'create-html-plugin',
    buildStart() {
      this.addWatchFile(templatePath);
    },
    async generateBundle(options, bundle) {
      bundle['index.html'] = {
        fileName: 'index.html',
        isAsset: true,
        source: await generateShell(bundle, { templatePath, isDev }),
      };
      bundle['error.html'] = {
        fileName: 'error.html',
        isAsset: true,
        source: await generateShell(bundle, { templatePath, isDev, isError: true }),
      };
    },
  };
}
