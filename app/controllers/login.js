const loginTemplate = require('../../shared/templates/login.jade');
const defaultController = require('./default');

// params, state, url
module.exports = () => {
  defaultController(loginTemplate);
};
