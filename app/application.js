const $ = require('jquery');
const main = require('./scripts/main');
const global = require('./scripts/global');
const routes = require('./scripts/routes');

const App = {
  init: function init() {
    $(document).ready(() => {
      if ($('#userLoggedIn').length > 0) global.isLoggedIn = true;
      else global.isLoggedIn = false;
      global.user = $('#userName').val();

      routes.start();
      main.init();
    });
  },
};

module.exports = App;
