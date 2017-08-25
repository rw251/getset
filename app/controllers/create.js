/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

const createTemplate = require('../../shared/templates/create.jade');
const createResultsTemplate = require('../../shared/templates/createResults.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
const synonymTemplate = require('../../shared/templates/partials/synonyms.jade');
const graphUtils = require('../scripts/graph-utils');
const global = require('../scripts/global');
const utils = require('../scripts/utils');
const defaultController = require('./default');
const $ = require('jquery');
const FileSaver = require('file-saver');
const JSZip = require('jszip');

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

const getMetaDataFile = () => {
  const metadata = {
    includeTerms: Object.keys(s),
    excludeTerms: Object.keys(e),
    terminology: currentTerminology,
  };
  if (global.user) {
    metadata.createdBy = {};
    if (global.user.name) metadata.createdBy.name = global.user.name;
    if (global.user.email) metadata.createdBy.email = global.user.email;
  }
  metadata.createdOn = new Date();
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json;charset=utf-8' });
  return blob;
};
const getCodeSetFile = () => {
  const currentCodeSet = [];
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      if (!currentGroups.matched[gi][i].exclude) currentCodeSet.push(code.code || code._id);
    });
  });
  const blob = new Blob([currentCodeSet.join('\r\n')], { type: 'text/plain;charset=utf-8' });
  return blob;
};
const triggerDownload = (file, name) => {
  FileSaver.saveAs(file, name);
};
const zipFiles = (files) => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.content);
  });
  let promise = null;
  if (JSZip.support.uint8array) {
    promise = zip.generateAsync({ type: 'uint8array' });
  } else {
    promise = zip.generateAsync({ type: 'string' });
  }
  return promise;
};

const refreshExclusion = () => {
  const excludedTerms = Object.keys(e);
  currentGroups.excluded = [];

  // update the excluded codes for the set of matched codes
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      // code.description = [].concat(code.description);
      if (excludedTerms.filter(a => code.description.toLowerCase().indexOf(a.toLowerCase()) > -1).length > 0) {
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

  // update the excluded codes for the set of unmatched codes
  currentGroups.unmatched.forEach((g, gi) => {
    g.forEach((code, i) => {
      // code.description = [].concat(code.description);
      if (excludedTerms.filter(a => code.description.toLowerCase().indexOf(a.toLowerCase()) > -1).length > 0) {
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

  // finally, add to the exclude list any unmatched items who have an excluded ancestor
  currentGroups.unmatched.forEach((g, gi) => {
    g.forEach((code, i) => {
      if (currentGroups.excluded.filter(a => code.ancestors.indexOf(utils.getCodeForTerminology(a.code, currentTerminology)) > -1).length > 0) {
        if (!currentGroups.unmatched[gi][i].excludedByParent) {
          currentGroups.unmatched[gi][i].excludedByParent = true;
          currentGroups.numUnmatched -= 1;
        }
        currentGroups.excluded.push(currentGroups.unmatched[gi][i]);
      } else if (currentGroups.unmatched[gi][i].excludedByParent) {
        currentGroups.numUnmatched += 1;
        delete currentGroups.unmatched[gi][i].excludedByParent;
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
  const lowerCaseTerm = term.toLowerCase();
  startedAt = new Date();
  if (isExclusion) {
    e[lowerCaseTerm] = true;
    refreshExclusionUI();
    refreshExclusion();
  } else {
    s[lowerCaseTerm] = true;
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
  const latestSynonym = element.val().trim();
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

  let lastPopOverElements;
  let lastSelectedText = '';

  /* document.addEventListener('selectionchange', () => {
    textSelected();
  });*/

  $('#results')
    .on('shown.bs.tab', 'a[data-toggle="tab"]', (evt) => {
      currentGroups.selected = evt.target.href.split('#')[1];
    })
    .on('mouseup', 'td', (evt) => {
      let selection = '';
      if (window.getSelection) {
        selection = window.getSelection();
      } else if (document.selection) {
        selection = document.selection.createRange();
      }
      if (selection.toString() === lastSelectedText) return;
      lastSelectedText = selection.toString();
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
        lastPopOverElements.popover('destroy');
        lastPopOverElements = null;
      }
    })
    .on('click', '.btn-include', () => {
      $synonym.include.add.click();
    })
    .on('click', '.btn-exclude', () => {
      $synonym.exclude.add.click();
    })
    .on('click', '#downloadCodeSet,#downloadAll', (evt) => {
      evt.preventDefault();
      const metadata = getMetaDataFile();
      const codeSet = getCodeSetFile();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');

      zipFiles([
        { content: codeSet, name: `codeset.${timestamp}.txt` },
        { content: metadata, name: `codeset.metadata.${timestamp}.json` },
      ]).then((file) => {
        // console.log(file);
        triggerDownload(new Blob([file], { type: 'application/zip' }), `codeset.${timestamp}.zip`);
      }).catch((err) => {
        console.log(`whoops ${err}`);
      });
      // triggerDownload(str2bytes(;
    })
    .on('click', '#downloadCodes', (evt) => {
      evt.preventDefault();
      const codeSet = getCodeSetFile();
      triggerDownload(codeSet, `codeset.${new Date().toISOString().replace(/[^0-9]/g, '')}.txt`);
    })
    .on('click', '#downloadMeta', (evt) => {
      evt.preventDefault();
      const metadata = getMetaDataFile();
      triggerDownload(metadata, `codeset.metadata.${new Date().toISOString().replace(/[^0-9]/g, '')}.json`);
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
