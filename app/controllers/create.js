const createTemplate = require('../../shared/templates/create.jade');
const defaultController = require('./default');

// params, state, url
module.exports = () => {
  defaultController(createTemplate);
};
