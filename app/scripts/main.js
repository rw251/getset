const $ = require('jquery');

window.$ = $;
window.jQuery = $;
require('bootstrap');

const init = function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
           .register('/sw.js')
           .then(() => { console.log('main.js -> Service Worker Registered'); });
  }
};

module.exports = { init };
