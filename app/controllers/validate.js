const validateTemplate = require('../../shared/templates/validate.jade');
const defaultController = require('./default');

// params, state, url
module.exports = () => {
  defaultController(validateTemplate);
};
