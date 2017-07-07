/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

const createTemplate = require('../../shared/templates/create.jade');
const createResultsTemplate = require('../../shared/templates/createResults.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
const synonymTemplate = require('../../shared/templates/partials/synonyms.jade');
const graphUtils = require('../scripts/graph-utils');
const utils = require('../scripts/utils');
const defaultController = require('./default');
const $ = require('jquery');

// Add a case insensitive contains
$.expr[':'].icontains = (a, i, m) => $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;

// jQuery elements
const $synonym = { include: {}, exclude: {} };
let $results;
let $status;
let startedAt;

const currentGroups = { excluded: [] };

const displayResults = (groups) => {
  const html = createResultsTemplate(groups);
  if (new Date() - startedAt < 150) {
    $results.html(html);
  } else {
    $results.fadeOut(500, () => {
      $results.html(html).fadeIn(300);
    });
  }
};

let currentTerminology = '';

const s = {};
const e = {};

const refreshExclusion = () => {
  const exArray = Object.keys(e);
  currentGroups.excluded = [];
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      // code.description = [].concat(code.description);
      if (exArray.filter(a => code.description.toLowerCase().indexOf(a.toLowerCase()) > -1).length > 0) {
        if (!currentGroups.matched[gi][i].exclude) {
          currentGroups.matched[gi][i].exclude = true;
          currentGroups.numMatched -= 1;
        }
        currentGroups.excluded.push(currentGroups.matched[gi][i]);
      } else if (currentGroups.matched[gi][i].exclude) {
        currentGroups.numMatched += 1;
        delete currentGroups.matched[gi][i].exclude;
      }
    });
  });
  currentGroups.unmatched.forEach((g, gi) => {
    g.forEach((code, i) => {
      // code.description = [].concat(code.description);
      if (exArray.filter(a => code.description.toLowerCase().indexOf(a.toLowerCase()) > -1).length > 0) {
        if (!currentGroups.unmatched[gi][i].exclude) {
          currentGroups.unmatched[gi][i].exclude = true;
          currentGroups.numUnmatched -= 1;
        }
        currentGroups.excluded.push(currentGroups.unmatched[gi][i]);
      } else if (currentGroups.unmatched[gi][i].exclude) {
        currentGroups.numUnmatched += 1;
        delete currentGroups.unmatched[gi][i].exclude;
      }
    });
  });
  displayResults(currentGroups);
};

const refresh = () => {
  $status.text('Refreshing list...');
  $results.html(ajaxLoaderTemplate());
  currentTerminology = $('input[name=terminology]:checked').val();
  setTimeout(() => {
    const terms = Object.keys(s);
    $
    .ajax({
      type: 'POST',
      url: '/code/search',
      data: JSON.stringify({ terminology: currentTerminology, terms }),
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      $status.text(`Result! (n=${data.codes.length})`);
      const hierarchies = graphUtils.getHierarchies(data.codes, currentTerminology, terms);
      currentGroups.matched = hierarchies.matched;
      currentGroups.unmatched = hierarchies.unmatched;
      currentGroups.numMatched = hierarchies.numMatched;
      currentGroups.numUnmatched = hierarchies.numUnmatched;
      // displayResults(currentGroups);
      refreshExclusion();
    });
  }, 1);
};

const clearInputs = () => {
  $synonym.include.input.val('');
  $synonym.exclude.input.val('');
};

const refreshSynonymUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(s) });
  $synonym.include.list.html(html);
  clearInputs();
};

const refreshExclusionUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(e) });
  $synonym.exclude.list.html(html);
  clearInputs();
};

const addTerm = (term, isExclusion) => {
  startedAt = new Date();
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
      if (Object.keys(s).length > 0) refresh();
    }
  });
};

const addIfLongEnough = (element) => {
  const latestSynonym = element.val();
  if (latestSynonym.length < 2) {
        // alertBecauseTooShort
  } else {
    addTerm(latestSynonym, element === $synonym.exclude.input);
  }
};

const wireup = () => {
  $synonym.include.input = $('#synonym');
  $synonym.include.input.focus();
  $synonym.exclude.input = $('#exclusion');
  $synonym.include.add = $('#addSynonym');
  $synonym.exclude.add = $('#addExclusion');
  $results = $('#results');
  $status = $('#status');
  $synonym.include.list = $('#synonymList');
  $synonym.exclude.list = $('#exclusionList');

  $synonym.include.input.on('keypress', (evt) => {
    if (evt.which === 13) { // ENTER key
      addIfLongEnough($synonym.include.input);
    }
  });

  $synonym.exclude.input.on('keypress', (evt) => {
    if (evt.which === 13) { // ENTER key
      addIfLongEnough($synonym.exclude.input);
    }
  });

  $('#createForm').on('submit', (evt) => {
    evt.preventDefault();
  });

  $synonym.include.add.on('click', () => { addIfLongEnough($synonym.include.input); });
  $synonym.exclude.add.on('click', () => { addIfLongEnough($synonym.exclude.input); });

  $('#results').on('shown.bs.tab', 'a[data-toggle="tab"]', (evt) => {
    currentGroups.selected = evt.target.href.split('#')[1];
  });

  let lastPopOverElements;
  $('#results').on('mouseup', 'td', (evt) => {
    let selection = '';
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection) {
      selection = document.selection.createRange();
    }
    $synonym.include.input.val(selection);
    $synonym.exclude.input.val(selection);

    if (selection.toString().length > 0) {
      if (lastPopOverElements) {
        lastPopOverElements.popover('hide');
        lastPopOverElements = null;
      }
      const popupElement = '<div class="btn-group"><button class="btn btn-sm btn-success btn-include">Include</button><button class="btn btn-sm btn-danger btn-exclude">Exclude</button></div>';
      const selectionCoords = utils.getSelectionCoords();
      $(evt.target).popover({
        animation: true,
        content: popupElement,
        container: '#results',
        html: true,
        placement: 'right',
      });
      setTimeout(() => {
        $('.popover').css('left', (selectionCoords.right + 25) - $('#results').offset().left);
      }, 1);
      if (!lastPopOverElements) lastPopOverElements = $(evt.target);
      else lastPopOverElements = lastPopOverElements.add($(evt.target));
    } else if (lastPopOverElements) {
      lastPopOverElements.popover('hide');
      lastPopOverElements = null;
    }
  });

  $('#results').on('click', '.btn-include', () => {
    $synonym.include.add.click();
  });

  $('#results').on('click', '.btn-exclude', () => {
    $synonym.exclude.add.click();
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
