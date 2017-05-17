const searchTemplate = require('../../shared/templates/search.jade');
const defaultController = require('./default');

// params, state, url
module.exports = () => {
  defaultController(searchTemplate);
};
