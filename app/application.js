const $ = require('jquery');
const main = require('./scripts/main');

const App = {
  init: function init() {
    $(document).ready(() => {
      main.init();
    });
  },
};

module.exports = App;
