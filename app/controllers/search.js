const searchTemplate = require('../../shared/templates/search.jade');
const searchResultsTemplate = require('../../shared/templates/searchResults.jade');
const defaultController = require('./default');
const utils = require('../scripts/utils');
const global = require('../scripts/global');
const page = require('page');
const $ = require('jquery');

const wireup = () => {
  $('#results').on('click', '.btn-delete', (evt) => {
    const $button = $(evt.currentTarget);
    const $row = $button.closest('tr');
    const $btnGroup = $button.closest('.btn-group');
    $btnGroup.replaceWith($('<span><i class="fa fa-trash fa-fw fa-spin fa-pulse"></i> Deleting..</span>'));
    $
      .ajax({
        url: `/codeset/${$button.data('id')}`,
        dataType: 'json',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ path: $button.data('path') }),
      })
      .done(() => {
        $row.fadeOut(1000, () => {
          $row.remove();
        });
      });
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-edit', (evt) => {
    const $button = $(evt.currentTarget);
    global.codeSetId = $button.data('id');
    delete global.currentSet;
    page('/create');
    // const $row = $button.closest('tr');
    console.log(`editing...${$button.data('path')}`);
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-validate', (evt) => {
    const $button = $(evt.currentTarget);
    // const $row = $button.closest('tr');
    console.log(`validating...${$button.data('path')}`);
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-download', (evt) => {
    const $button = $(evt.currentTarget);
    // const $row = $button.closest('tr');
    console.log(`downloading...${$button.data('path')}`);
    evt.preventDefault();
  });
  $
    .ajax({
      url: '/codesetlist',
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((list) => {
      list = list.map((item) => {
        item.createdOn = utils.momentFromNow(new Date(item.createdOn));
        item.lastUpdated = utils.momentFromNow(new Date(item.lastUpdated));
        return item;
      });
      const html = searchResultsTemplate({ list, user: global.user });
      $('#results').html(html);
    });
};

module.exports = {

  show: () => {
    defaultController(searchTemplate);
    wireup();
  },

};
