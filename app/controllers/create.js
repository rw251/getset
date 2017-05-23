/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

const createTemplate = require('../../shared/templates/create.jade');
const codeListTemplate = require('../../shared/templates/partials/code-list.jade');
const defaultController = require('./default');
const $ = require('jquery');

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
const debounce = (func, wait, immediate) => {
  let timeout;
  return () => {
    const context = this;
    const args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const displayResults = (codes) => {
  const html = codeListTemplate({ codes });
  $('#output').html(html);
};

const doSearch = () => {
  $('#status').text('Searching...');
  $
    .ajax({
      type: 'GET',
      url: `/code/search/${$('input[name=terminology]:checked').val()}/${$('#synonym').val()}`,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      $('#status').text(`Result! (n=${data.length})`);
      displayResults(data.map(v => ({ code: v._id, description: v.t.split('|')[v.t.split('|').length - 1] })));
    });
};

const search = debounce(() => {
  doSearch();
}, 250);

let lastTextValue = '';

const wireup = () => {
  $('#synonym').on('keyup', () => {
    if ($('#synonym').val().length >= 3 && $('#synonym').val() !== lastTextValue) {
      lastTextValue = $('#synonym').val();
      search();
    }
  });

  $('#createForm').on('submit', (e) => {
    e.preventDefault();
  });
};

module.exports = {

  show: () => {
    defaultController(createTemplate);
    wireup();
  },

};
