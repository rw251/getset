const searchTemplate = require('../../shared/templates/search.jade');
const searchResultsTemplate = require('../../shared/templates/searchResults.jade');
const defaultController = require('./default');
const utils = require('../scripts/utils');
const $ = require('jquery');

const wireup = () => {
  $
    .ajax({
      url: '/codesetlist',
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((list) => {
      list = list.map((item) => {
        item.createdOn = utils.momentFromNow(new Date(item.createdOn));
        return item;
      });
      const html = searchResultsTemplate({ list });
      $('#results').html(html);
    });
};

module.exports = {

  show: () => {
    defaultController(searchTemplate);
    wireup();
  },

};
