/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const enhanceTemplate = require('../../shared/templates/enhance.jade');
// const enhanceResultsTemplate = require('../../shared/templates/enhanceResults.jade');
const enhanceResultsTemplate = require('../../shared/templates/enhanceResultsAlt.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
const synonymTemplate = require('../../shared/templates/partials/synonyms.jade');
const codeTableTemplate = require('../../shared/templates/partials/code-table.jade');
const codeFrequencyTableTemplate = require('../../shared/templates/partials/code-freq-table.jade');
const defaultController = require('./default');
const $ = require('jquery');

let $output;
let $codeSet;
let currentTerminology = '';
let $synonymInput;
let $exclusionInput;
let $synonymAdd;
let $exclusionAdd;
let $synonymList;
let $exclusionList;
let $separatorForm;
const $separatorRadio = {};

const s = {};
const e = {};
let x = {};
let m = {};

let existingList;
let matchedList;

// Finds y value of given object
const findPos = (obj) => {
  let curtop = 0;
  if (obj.offsetParent) {
    do {
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
  }
  return [curtop];
};

const removeExclusions = list => list.filter((item) => {
  let isMatch = true;

  Object.keys(e).forEach((v) => {
    if (item.t.toLowerCase().indexOf(v.toLowerCase()) >= 0) isMatch = false;
  });

  return isMatch;
});

const returnExclusions = list => list.filter((item) => {
  let isMatch = false;

  Object.keys(e).forEach((v) => {
    if (item.t.toLowerCase().indexOf(v.toLowerCase()) >= 0) isMatch = true;
  });

  return isMatch;
});

const existingNotMatched = () => removeExclusions(existingList.filter(item => !m[item._id]));

const matchedNotExisting = () => removeExclusions(matchedList.filter(item => !x[item._id]));

const matchedExisting = () => removeExclusions(matchedList.filter(item => x[item._id]));

const matchedExcluded = () => returnExclusions(matchedList);

const refreshMatchedInExisting = () => {
  const codes = matchedExisting();
  const id = '#matchedExistingTabContent';
  $(id).html(codeTableTemplate({ codes }));
  $(`a[href="${id}"]`).text($(`a[href="${id}"]`).text().replace(/\([0-9]+\)/, `(${codes.length})`));
};

const refreshMatchedNotInExisting = () => {
  const codes = matchedNotExisting();
  const id = '#matchedNotExistingTabContent';
  $(id).html(codeTableTemplate({ codes }));
  $(`a[href="${id}"]`).text($(`a[href="${id}"]`).text().replace(/\([0-9]+\)/, `(${codes.length})`));
};

const refreshExistingNotMatched = () => {
  const codes = existingNotMatched();
  const id = '#existingNotMatchedTabContent';
  $(id).html(codeTableTemplate({ codes }));
  $(`a[href="${id}"]`).text($(`a[href="${id}"]`).text().replace(/\([0-9]+\)/, `(${codes.length})`));
};

const refreshMatchedExcluded = () => {
  const codes = matchedExcluded();
  const id = '#excludedTabContent';
  $(id).html(codeTableTemplate({ codes }));
  $(`a[href="${id}"]`).text($(`a[href="${id}"]`).text().replace(/\([0-9]+\)/, `(${codes.length})`));
};

const refreshTermFrequency = () => {
  const codes = existingNotMatched();
  $('#frequencyTabContent').html(ajaxLoaderTemplate());
  setTimeout(() => {
    const codeSet = codes.map(c => c._id);
    $
      .ajax({
        type: 'POST',
        url: '/code/enhance',
        data: JSON.stringify({ terminology: currentTerminology, codes: codeSet }),
        dataType: 'json',
        contentType: 'application/json',
      })
      .done((data) => {
        $('#frequencyTabContent').html(codeFrequencyTableTemplate(data));
      });
  }, 1);
};

const refresh = () => {
  $
    .ajax({
      type: 'GET',
      url: `/code/search/${$('input[name=terminology]:checked').val()}/forlist?t=${Object.keys(s).join('&t=')}`,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      matchedList = data.codes;
      m = {};
      matchedList.forEach((code) => {
        m[code._id] = true;
      });
      refreshTermFrequency();
      refreshMatchedInExisting();
      refreshMatchedNotInExisting();
      refreshExistingNotMatched();
      refreshMatchedExcluded();
    });
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
    refreshTermFrequency();
    refreshExclusionUI();
    refreshMatchedInExisting();
    refreshMatchedNotInExisting();
    refreshMatchedExcluded();
  } else {
    s[term] = true;
    refreshSynonymUI();
    refresh();
  }

  $('.alert').alert().on('closed.bs.alert', (evt) => {
    const termToRemove = $(evt.target).data('value');
    if (e[termToRemove]) {
      delete e[termToRemove];
      refreshTermFrequency();
      refreshMatchedInExisting();
      refreshMatchedNotInExisting();
      refreshMatchedExcluded();
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

const getStamp = {
  exists: (numCodes, numUnfound) => {
    const rtn = { title: 'Found', status: 'warn' };
    rtn.perf = Math.floor((100 * numCodes) / (numCodes + numUnfound));

    if (rtn.perf === 100) rtn.status = 'pass';
    else if (rtn.perf < 90) rtn.status = 'fail';
    rtn.perf += '%';
    return rtn;
  },
  unmatchedChildren: (numUnmatchedChildren) => {
    const rtn = { title: 'Missing children', status: 'warn' };
    rtn.perf = numUnmatchedChildren;

    if (rtn.perf < 5) rtn.status = 'pass';
    else if (rtn.perf > 20) rtn.status = 'fail';
    return rtn;
  },
};

const separators = {
  comma: { id: 'sepComma', character: ',' },
  newline: { id: 'sepNewLine', character: '\n' },
  tab: { id: 'sepTab', character: '\t' },
};
let codeSetSeparator = separators.newline;

const updateSeparatorRadio = () => {
  $separatorRadio[codeSetSeparator.id]
    .prop('checked', true) // set radio to checked
    .parent() // get the parent label and..
    .addClass('active') // ..add the active class
    .siblings() // get all the other labels..
    .removeClass('active'); // ..and remove the active class
};

const updateCodeSetSeparator = (oldSep, newSep) => {
  $codeSet.val($codeSet.val().split(oldSep).join(newSep));
};

const wireUp = () => {
  $codeSet = $('#codeSet');
  $output = $('#results');
  $synonymInput = $('#synonym');
  $exclusionInput = $('#exclusion');
  $synonymAdd = $('#addSynonym');
  $exclusionAdd = $('#addExclusion');
  $synonymList = $('#synonymList');
  $exclusionList = $('#exclusionList');
  $separatorForm = $('#separatorForm');
  $('input[name="separator"]')
    .each((idx, el) => {
      $separatorRadio[el.id] = $(el);
    })
    .on('change', () => {
      const val = $('input[name="separator"]:checked').val();
      updateCodeSetSeparator(codeSetSeparator.character, separators[val].character);
      codeSetSeparator = separators[val];
    });

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

  $synonymAdd.on('click', () => {
    addIfLongEnough($synonymInput);
  });
  $exclusionAdd.on('click', () => {
    addIfLongEnough($exclusionInput);
  });

  $output.on('click', '.token', () => {
    window.scroll(0, findPos(document.getElementById('results')));
  });

  $codeSet.on('paste', () => {
    $output.html(ajaxLoaderTemplate());
    $separatorForm.show();
    currentTerminology = $('input[name=terminology]:checked').val();
    setTimeout(() => {
      if ($codeSet.val().indexOf('\t') > -1) codeSetSeparator = separators.tab;
      else if ($codeSet.val().indexOf(',') > -1) codeSetSeparator = separators.comma;
      else codeSetSeparator = separators.newline;
      updateSeparatorRadio();
      const codeSet = $codeSet.val().split(codeSetSeparator.character).filter(v => v.replace(/ /g, '').length > 0);
      $
        .ajax({
          type: 'POST',
          url: '/code/unmatchedChildren',
          data: JSON.stringify({ terminology: currentTerminology, codes: codeSet }),
          dataType: 'json',
          contentType: 'application/json',
        })
        .done((data) => {
          const codesObj = {};
          const stamps = [];
          stamps.push(getStamp.exists(data.codes.length, data.unfoundCodes.length));
          stamps.push(getStamp.unmatchedChildren(data.unmatchedCodes.length));
          data.stamps = stamps;
          data.codes.forEach((v) => {
            codesObj[v._id] = v;
          });
          existingList = data.codes;
          x = {};
          existingList.forEach((code) => {
            x[code._id] = true;
          });
          $output.fadeOut(500, () => {
            $output.html(enhanceResultsTemplate(data)).fadeIn(300);
          });
        });
    }, 1);
  });
};
// params, state, url
module.exports = {
  show: () => {
    defaultController(enhanceTemplate);
    wireUp();
  },
};
