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

let lastTextValue = '';
let mostRecent = 0;

const parseDescription = (description, searchTerm) => {
  const descriptionBits = [];
  const descArr = description.split('|');
  let n = descArr.length - 1;
  let left = '';

  if (description.toLowerCase().indexOf(searchTerm) < 0) {
    descriptionBits.push({ text: descArr[n] });
  } else {
    while (descArr[n].toLowerCase().indexOf(searchTerm) < 0) {
      n -= 1;
    }
    let idx = descArr[n].toLowerCase().indexOf(searchTerm);
    while (idx >= 0) {
      if (idx === 0) {
        descriptionBits.push({ text: descArr[n].substr(0, searchTerm.length), isSyn: true });
      } else {
        descriptionBits.push({ text: descArr[n].substr(0, idx) });
        descriptionBits.push({ text: descArr[n].substr(idx, searchTerm.length), isSyn: true });
      }
      left = descArr[n].substr(idx + searchTerm.length);
      idx = descArr[n].toLowerCase().indexOf(searchTerm, idx + searchTerm.length - 1);
    }
  }
  if (left.length > 0) {
    descriptionBits.push({ text: left });
  }
  return descriptionBits;
};

const doSearch = () => {
  $('#status').text('Searching...');
  $
    .ajax({
      type: 'GET',
      url: `/code/search/${$('input[name=terminology]:checked').val()}/${lastTextValue}`,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      if (data.timestamp < mostRecent) {
        console.log('Not updating as a newer query was fired');
      } else {
        mostRecent = data.timestamp;
        $('#status').text(`Result! (n=${data.codes.length})`);
        displayResults(data.codes.map(v => ({
          code: v._id,
          description: parseDescription(v.t, data.searchTerm) })));
      }
    });
};

const search = debounce(() => {
  doSearch();
}, 250);

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
