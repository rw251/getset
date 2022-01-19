// Custom rollup plugin for creating html pages
import { readFileSync } from 'fs';
import mustache from 'mustache';
import { findHashFromName } from './bundle-utils';
import { version } from '../package.json';
import headerComponent from '../src/client/components/partials/header';

// oddly this needs to be relative to root
const { rollbarClientToken } = require('./src/server/config.js');

function generateShell(bundle, { templatePath, isDev }) {
  const template = readFileSync(templatePath, 'utf8');
  const headerHtml = headerComponent(null, true);

  return mustache.to_html(template, {
    isProduction: !isDev,
    isDev,
    headerHtml,
    rollbarClientToken,
    scriptFile: findHashFromName(bundle, 'main'),
    title: 'Get Set',
    version,
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
    },
  };
}
