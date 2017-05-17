const enhanceTemplate = require('../../shared/templates/enhance.jade');
const defaultController = require('./default');

// params, state, url
module.exports = () => {
  defaultController(enhanceTemplate);
};
