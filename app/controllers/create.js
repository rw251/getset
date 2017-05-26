/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

const createTemplate = require('../../shared/templates/create.jade');
const codeListTemplate = require('../../shared/templates/partials/code-list.jade');
const synonymTemplate = require('../../shared/templates/partials/synonyms');
const graphUtils = require('../scripts/graph-utils');
const utils = require('../scripts/utils');
const defaultController = require('./default');
const $ = require('jquery');

// Add a case insensitive contains
$.expr[':'].icontains = (a, i, m) => $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;

// jQuery elements
let $synonymInput;
let $exclusionInput;
let $synonymAdd;
let $exclusionAdd;
let $outputInclude;
let $outputExclude;
let $status;
let $synonymList;
let $exclusionList;

let currentGroups;

const displayResults = (groups) => {
  const html = codeListTemplate({ groups });
  $outputInclude.html(html);
};

const lastTextValue = '';
let mostRecent = 0;
let currentTerminology = '';

const doSearch = () => {
  $status.text('Searching...');
  $
    .ajax({
      type: 'GET',
      url: `/code/search/${$('input[name=terminology]:checked').val()}/for/${lastTextValue}`,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      if (data.timestamp < mostRecent) {
        console.log('Not updating as a newer query was fired');
      } else {
        currentTerminology = $('input[name=terminology]:checked').val();
        mostRecent = data.timestamp;
        $status.text(`Result! (n=${data.codes.length})`);
        currentGroups = graphUtils.getHierarchy(data.codes, currentTerminology, data.searchTerm);
        displayResults(currentGroups);
      }
    });
};

const search = utils.debounce(() => {
  doSearch();
}, 250);

const s = {};
const e = {};

const refresh = () => {
  $status.text('Refreshing list...');
  $
    .ajax({
      type: 'GET',
      url: `/code/search/${$('input[name=terminology]:checked').val()}/forlist?t=${Object.keys(s).join('&t=')}`,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      currentTerminology = $('input[name=terminology]:checked').val();
      mostRecent = data.timestamp;
      $status.text(`Result! (n=${data.codes.length})`);
      currentGroups = graphUtils.getHierarchy(data.codes, currentTerminology, data.searchTerm);
      displayResults(currentGroups);
    });
};
const refreshExclusion = () => {
  const exArray = Object.keys(e);
  currentGroups.forEach((g, gi) => {
    g.forEach((code, i) => {
      code.description = [].concat(code.description);
      if (exArray.filter(a => code.description.map(v => v.text).join('').toLowerCase().indexOf(a.toLowerCase()) > -1).length > 0) {
        currentGroups[gi][i].exclude = true;
      } else {
        delete currentGroups[gi][i].exclude;
      }
    });
  });
  displayResults(currentGroups);
  // Object.keys(e).forEach((v) => {
  //   $(`.code-description:icontains("${v}")`).each((i, el) => {
  //     const $el = $(el);
  //     $el.parent().addClass('exclusion');
  //     const text = $el.text();
  //     const idx = text.toLowerCase().indexOf(v.toLowerCase());
  //     const newEls = [];
  //     if (idx > 0) {
  //       newEls.push($(`<span class="code-description">${text.substr(0, idx)}</span>`));
  //     }
  //     newEls.push($(`<span class="code-description-exclusion">${text.substr(idx, v.length)}</span>`));
  //     if (idx + v.length < text.length) {
  //       newEls.push($(`<span class="code-description">${text.substr(idx + v.length)}</span>`));
  //     }
  //     newEls.forEach((vv, ii) => {
  //       if (ii === 0) $el.replaceWith(vv);
  //       else newEls[ii - 1].after(vv);
  //     });
  //   });
  // });
};
const refreshSynonymUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(s) });
  $synonymList.html(html);
  $synonymInput.val('');
};
const refreshExclusionUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(e) });
  $exclusionList.html(html);
  $exclusionInput.val('');
};


const addTerm = (term, isExclusion) => {
  if (isExclusion) {
    e[term] = true;
    refreshExclusionUI();
    refreshExclusion();
  } else {
    s[term] = true;
    refreshSynonymUI();
    refresh();
  }

  $('.alert').alert().on('closed.bs.alert', (evt) => {
    const termToRemove = $(evt.target).data('value');
    if (e[termToRemove]) {
      delete e[termToRemove];
      refreshExclusion();
    } else {
      delete s[termToRemove];
      refresh();
    }
  });
};

const addIfLongEnough = (element) => {
  const latestSynonym = element.val();
  if (latestSynonym.length < 2) {
        // alertBecauseTooShort
  } else {
    addTerm(latestSynonym, element === $exclusionInput);
  }
};

const wireup = () => {
  $synonymInput = $('#synonym');
  $exclusionInput = $('#exclusion');
  $synonymAdd = $('#addSynonym');
  $exclusionAdd = $('#addExclusion');
  $outputInclude = $('#outputInclude');
  $outputExclude = $('#outputExclude');
  $status = $('#status');
  $synonymList = $('#synonymList');
  $exclusionList = $('#exclusionList');

  $synonymInput.on('keypress', (evt) => {
    // If ENTER key
    if (evt.which === 13) {
      addIfLongEnough($synonymInput);
    }
    // if ($('#synonym').val().length >= 3 && $('#synonym').val() !== lastTextValue) {
    //   lastTextValue = $('#synonym').val();
    //   search();
    // }
  });

  $exclusionInput.on('keypress', (evt) => {
    // If ENTER key
    if (evt.which === 13) {
      addIfLongEnough($exclusionInput);
    }
  });

  $('#createForm').on('submit', (e) => {
    e.preventDefault();
  });

  $synonymAdd.on('click', () => {
    addIfLongEnough($synonymInput);
  });
  $exclusionAdd.on('click', () => {
    addIfLongEnough($exclusionInput);
  });

  $('.code-list').on('click', '.code-line', (evt) => {
    // The line that is clicked and the one after it
    const clickedLine = $(evt.currentTarget);
    let nextLine = clickedLine.next();

    // Indent of the clicked line and the next line
    const indent = clickedLine.find('.code-padding').length;
    let nextIndent = nextLine.length > 0 ? nextLine.find('.code-padding').length : indent;

    // Only need to collapse if there are more elements and their depth is greater
    // than the current
    if (nextIndent <= indent) return;

    clickedLine.toggleClass('collapsed');

    while (nextLine.length > 0 && nextIndent > indent) {
      if (clickedLine.hasClass('collapsed')) {
        nextLine.addClass('hidden');
      } else {
        nextLine.removeClass('hidden');
        nextLine.removeClass('collapsed');
      }
      nextLine = nextLine.next();
      nextIndent = nextLine.length > 0 ? nextLine.find('.code-padding').length : indent;
    }
  });
};

module.exports = {

  show: () => {
    defaultController(createTemplate);
    wireup();
  },

};
