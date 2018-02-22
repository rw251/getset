/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const enhanceTemplate = require('../../shared/templates/enhance.jade');
const enhanceResultsTemplate = require('../../shared/templates/enhanceResultsAlt.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
const synonymTemplate = require('../../shared/templates/partials/synonyms.jade');
const utils = require('../scripts/utils');
const graphUtils = require('../scripts/graph-utils');
const defaultController = require('./default');
const $ = require('jquery');

const $synonym = { include: {}, exclude: {} };
const $separatorRadio = {};
const currentGroups = { excluded: [], matchedDescendantButNotMatched: [] };
// will have:
// codeSet
// inCodeSetNotInTerminology
// notInCodeSetDescendantOfCodeSet
// inCodeSetAndMatched,
// inCodeSetAndUnmatched,
// notInCodeSetButMatched,
// matchedDescendantButNotMatched,
const s = {};
const e = {};
const separators = {
  comma: { id: 'sepComma', character: ',' },
  newline: { id: 'sepNewLine', character: '\n' },
  tab: { id: 'sepTab', character: '\t' },
};

let codeSetSeparator = separators.newline;
let $results;
let $codeSet;
let currentTerminology = '';
let $separatorForm;
let startedAt;

const displayResults = (groups) => {
  const html = enhanceResultsTemplate(groups);
  if (new Date() - startedAt < 150) {
    $results.html(html);
  } else {
    $results.fadeOut(500, () => {
      $results.html(html).fadeIn(300);
    });
  }
};

const getStamp = {
  exists: (numCodes, numUnfound) => {
    const rtn = { title: 'found', status: 'warn', id: 'unfoundPanel' };
    rtn.perf = Math.floor((100 * numCodes) / (numCodes + numUnfound));

    if (rtn.perf === 100) rtn.status = 'pass';
    else if (rtn.perf < 90) rtn.status = 'fail';
    rtn.perf += '%';
    return rtn;
  },
  unmatchedChildren: (numUnmatchedChildren) => {
    const rtn = { title: 'missing children', status: 'warn', id: 'unmatchedChildrenPanel' };
    rtn.perf = numUnmatchedChildren;

    if (rtn.perf < 5) rtn.status = 'pass';
    else if (rtn.perf > 20) rtn.status = 'fail';
    return rtn;
  },
  unmatchedCodes: (numUnmatchedCodes) => {
    const rtn = { title: 'unmatched codes', status: 'warn', id: 'unmatchedCodesPanel' };
    rtn.perf = numUnmatchedCodes;

    if (rtn.perf < 5) rtn.status = 'pass';
    else if (rtn.perf > 20) rtn.status = 'fail';
    return rtn;
  },
  matchedDescendantButNotMatched: (numMatchedDescendantButNotMatched) => {
    const rtn = { title: 'unmatched descendants', status: 'warn', id: 'matchedDescendantButNotMatchedPanel' };
    rtn.perf = numMatchedDescendantButNotMatched;

    if (rtn.perf < 5) rtn.status = 'pass';
    else if (rtn.perf > 20) rtn.status = 'fail';
    return rtn;
  },
  notInCodeSetButMatched: (numNotInCodeSetButMatched) => {
    const rtn = { title: 'matched but not in code set', status: 'warn', id: 'notInCodeSetButMatchedPanel' };
    rtn.perf = numNotInCodeSetButMatched;

    if (rtn.perf < 5) rtn.status = 'pass';
    else if (rtn.perf > 20) rtn.status = 'fail';
    return rtn;
  },
  excluded: (numExcluded) => {
    const rtn = { title: 'excluded', status: 'pass', id: 'excludedPanel' };
    rtn.perf = numExcluded;
    return rtn;
  },
};

// For a given description when passed to a filter returns all terms
// that are contained in that description
const thatMatch = description => term => description.toLowerCase().indexOf(term.toLowerCase()) > -1;

const refreshExclusion = () => {
  const excludedTerms = Object.keys(e);
  currentGroups.excluded = [];

// inCodeSetAndMatched,
// inCodeSetAndUnmatched,
// matchedDescendantButNotMatched,

  // do this for: notInCodeSetDescendantOfCodeSet,
  // matchedDescendantButNotMatched, notInCodeSetButMatched

  if (currentGroups.notInCodeSetButMatched) {
    currentGroups.notInCodeSetButMatched.forEach((g, gi) => {
      g.forEach((code, i) => {
        if (excludedTerms.filter(thatMatch(code.description)).length > 0) {
          if (!currentGroups.notInCodeSetButMatched[gi][i].exclude) {
            currentGroups.notInCodeSetButMatched[gi][i].exclude = true;
            currentGroups.numNotInCodeSetButMatched -= 1;
          }
          currentGroups.excluded.push(currentGroups.notInCodeSetButMatched[gi][i]);
        } else if (currentGroups.notInCodeSetButMatched[gi][i].exclude) {
          currentGroups.numNotInCodeSetButMatched += 1;
          delete currentGroups.notInCodeSetButMatched[gi][i].exclude;
        }
      });
    });
  }

  if (currentGroups.notInCodeSetDescendantOfCodeSet) {
    currentGroups.notInCodeSetDescendantOfCodeSet.forEach((g, gi) => {
      g.codes.forEach((code, i) => {
        if (excludedTerms.filter(thatMatch(code.t)).length > 0) {
          if (!currentGroups.notInCodeSetDescendantOfCodeSet[gi].codes[i].exclude) {
            currentGroups.notInCodeSetDescendantOfCodeSet[gi].codes[i].exclude = true;
            currentGroups.numUnmatchedCodesOriginal -= 1;
          }
          currentGroups.excluded.push(currentGroups.notInCodeSetDescendantOfCodeSet[gi].codes[i]);
        } else if (currentGroups.notInCodeSetDescendantOfCodeSet[gi].codes[i].exclude) {
          currentGroups.numUnmatchedCodesOriginal += 1;
          delete currentGroups.notInCodeSetDescendantOfCodeSet[gi].codes[i].exclude;
        }
      });
      if (g.codes.length === g.codes.filter(v => v.exclude).length) {
        currentGroups.notInCodeSetDescendantOfCodeSet[gi].exclude = true;
      } else {
        delete currentGroups.notInCodeSetDescendantOfCodeSet[gi].exclude;
      }
    });
  }

  // update the excluded codes for the set of matched codes
  /* currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      // code.description = [].concat(code.description);
      if (excludedTerms.filter(thatMatch(code.description)).length > 0) {
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
      if (excludedTerms.filter(thatMatch(code.description)).length > 0) {
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
*/

  const stamps = [];
  stamps.push(getStamp.exists(currentGroups.codeSet.length, currentGroups.inCodeSetNotInTerminology.length));
  stamps.push(getStamp.unmatchedChildren(currentGroups.numUnmatchedCodesOriginal));
  stamps.push(getStamp.unmatchedCodes(currentGroups.numInCodeSetAndUnmatched));
  stamps.push(getStamp.matchedDescendantButNotMatched(currentGroups.numMatchedDescendantButNotMatched));
  stamps.push(getStamp.notInCodeSetButMatched(currentGroups.numNotInCodeSetButMatched));
  stamps.push(getStamp.excluded(currentGroups.excluded.length));
  currentGroups.stamps = stamps;
  displayResults(currentGroups);
};

const refresh = () => {
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
        const hierarchies = graphUtils.getHierarchiesWithExistingCodeList(data.codes,
            currentTerminology, terms, currentGroups.codeSet, currentGroups.codeLookup);

        // inCodeSetAndMatched,
        // inCodeSetAndUnmatched,
        // notInCodeSetButMatched,
        // matchedDescendantButNotMatched,
        // numInCodeSetAndMatched,
        // numInCodeSetAndUnmatched,
        // numNotInCodeSetButMatched,
        // numMatchedDescendantButNotMatched,
        Object.keys(hierarchies).forEach((key) => {
          currentGroups[key] = hierarchies[key];
        });

        refreshExclusion();
      });
  }, 1);
};
const refreshSynonymUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(s) });
  $synonym.include.list.html(html);
  $synonym.include.input.val('');
};
const refreshExclusionUI = () => {
  const html = synonymTemplate({ synonyms: Object.keys(e) });
  $synonym.exclude.list.html(html);
  $synonym.exclude.input.val('');
};

const addTerm = (term, isExclusion) => {
  startedAt = new Date();
  if (isExclusion) {
    e[term] = true;
    // refreshTermFrequency();
    refreshExclusionUI();
    // refreshMatchedInExisting();
    // refreshMatchedNotInExisting();
    // refreshMatchedExcluded();
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
      // refreshTermFrequency();
      // refreshMatchedInExisting();
      // refreshMatchedNotInExisting();
      // refreshMatchedExcluded();
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

const updateSeparatorRadio = () => {
  $separatorRadio[codeSetSeparator.id]
    .prop('checked', true) // set radio to checked
    .parent() // get the parent label and..
    .addClass('active') // ..add the active class
    .siblings() // get all the other labels..
    .removeClass('active'); // ..and remove the active class
};

const updateCodeSetSeparator = (oldSep, newSep) => {
  $codeSet.val($codeSet.val().trim().split(oldSep).join(newSep));
};

const updateFromCodeSet = (codeSet) => {
  $
    .ajax({
      type: 'POST',
      url: '/code/unmatchedChildren',
      data: JSON.stringify({ terminology: currentTerminology, codes: codeSet }),
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((data) => {
      // data is
      //  {
      //    codes, // list of all matching codes
      //    unfoundCodes, // codes pasted that don't appear in the terminology
      //    unmatchedCodes, // descendants of codes not included in list
      //  }
      const terms = Object.keys(s);
      const hierarchies = graphUtils.getHierarchies(data.codes, currentTerminology, terms);
      const stamps = [];
      stamps.push(getStamp.exists(data.codes.length, data.unfoundCodes.length));
      stamps.push(getStamp.unmatchedChildren(data.unmatchedCodes.length));
      stamps.push(getStamp.unmatchedCodes(data.codes.length));
      stamps.push(getStamp.matchedDescendantButNotMatched(0));
      stamps.push(getStamp.notInCodeSetButMatched(0));
      stamps.push(getStamp.excluded(0));
      currentGroups.stamps = stamps;
      currentGroups.codeSet = data.codes;
      currentGroups.codeLookup = {};
      data.codes.forEach((code) => {
        currentGroups.codeLookup[utils.getCodeForTerminology(code._id, currentTerminology)] = code;
      });
      currentGroups.numUnmatchedCodesOriginal = data.unmatchedCodes.length;
      const unmatchedCodesReformatted = {};
      data.unmatchedCodes.forEach((umc) => {
        umc.a.split(',').forEach((ancestor) => {
          if (!unmatchedCodesReformatted[ancestor]) unmatchedCodesReformatted[ancestor] = [umc];
          else unmatchedCodesReformatted[ancestor].push(umc);
        });
      });
      currentGroups.inCodeSetNotInTerminology = data.unfoundCodes;
      currentGroups.notInCodeSetDescendantOfCodeSet = Object
        .keys(unmatchedCodesReformatted)
        .filter(umc => currentGroups.codeLookup[utils.getCodeForTerminology(umc, currentTerminology)])
        .map(umc => ({
          code: utils.getCodeForTerminology(umc, currentTerminology),
          description: currentGroups.codeLookup[utils.getCodeForTerminology(umc, currentTerminology)].t,
          codes: unmatchedCodesReformatted[umc].sort((a, b) => {
            if (a._id < b._id) return -1;
            else if (a._id > b._id) { return 1; }
            return 0;
          }),
        }));
      currentGroups.inCodeSetAndUnmatched = hierarchies.unmatched;
      currentGroups.numInCodeSetAndUnmatched = hierarchies.numUnmatched;
      $results.fadeOut(500, () => {
        $results.html(enhanceResultsTemplate(currentGroups)).fadeIn(300);
      });
    });
};

const wireUp = () => {
  $codeSet = $('#codeSet');
  $results = $('#results');
  $synonym.include.input = $('#synonym');
  $synonym.include.input.focus();
  $synonym.exclude.input = $('#exclusion');
  $synonym.include.add = $('#addSynonym');
  $synonym.exclude.add = $('#addExclusion');
  $synonym.include.list = $('#synonymList');
  $synonym.exclude.list = $('#exclusionList');
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

  $synonym.include.input.on('keypress', (evt) => {
    // If ENTER key
    if (evt.which === 13) {
      addIfLongEnough($synonym.include.input);
    }
    // if ($('#synonym').val().length >= 3 && $('#synonym').val() !== lastTextValue) {
    //   lastTextValue = $('#synonym').val();
    //   search();
    // }
  });

  $synonym.exclude.input.on('keypress', (evt) => {
    // If ENTER key
    if (evt.which === 13) {
      addIfLongEnough($synonym.exclude.input);
    }
  });

  $synonym.include.add.on('click', () => {
    addIfLongEnough($synonym.include.input);
  });
  $synonym.exclude.add.on('click', () => {
    addIfLongEnough($synonym.exclude.input);
  });

  let lastPopOverElements;
  let lastSelectedText = '';

  $results
    .on('mouseup', 'td', (evt) => {
      console.log(`up - ${Date.now()}`);
      let selection = '';
      if (window.getSelection) {
        selection = window.getSelection();
      } else if (document.selection) {
        selection = document.selection.createRange();
      }
      console.log(`up - ${selection.toString()} - ${lastSelectedText}`);
      if (selection.toString().trim() === lastSelectedText) return;
      lastSelectedText = selection.toString().trim();
      $synonym.include.input.val(lastSelectedText);
      $synonym.exclude.input.val(lastSelectedText);

      if (lastSelectedText.length > 0) {
        if (lastPopOverElements) {
          lastPopOverElements.popover('hide');
          lastPopOverElements = null;
        }
        const popupElement = '<div class="btn-group"><button class="btn btn-sm btn-success btn-include">Include</button><button class="btn btn-sm btn-danger btn-exclude">Exclude</button></div>';
        const selectionCoords = utils.getSelectionCoords();
        console.log(selectionCoords);
        console.log(evt);
        console.log(evt.target);
        console.log(evt.currentTarget);
        $(evt.target).parent().popover({
          animation: true,
          content: popupElement,
          container: '#results',
          selector: evt.target,
          html: true,
          placement: 'right',
        });
        setTimeout(() => {
          console.log((selectionCoords.right + 25) - $('#results').offset().left);
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
    .on('click', '.token', (event) => {
      // Magic number! 71 = height + padding of navigation bar.
      // window.scroll(0, utils.findPos(document.getElementById($(event.currentTarget).data('panel-id'))) - 71);
      /* $('html, body').animate({
        scrollTop: utils.findPos(document.getElementById($(event.currentTarget).data('panel-id'))),
      }, 2000);*/
      $('.scrollable').scroll();
      $('.scrollable').animate({
        scrollTop: utils.findPos(document.getElementById($(event.currentTarget).data('panel-id')))
          - utils.findPos(document.getElementById('resultTables')),
      }, 200);
    })
    .on('change', '#missingCodeCheckAll', (event) => {
      $('.missingCode').prop('checked', event.currentTarget.checked);
    })
    .on('click', '.addSelectedMissingCodes', () => {
      const codesToAdd = $('input.missingCode:checked').map((i, v) => v.value).get();
      if (codesToAdd.length === 0) {
        alert('No codes appear to be selected. Please try again.');
      } else {
        const newCodeSet = $codeSet.val().trim().split(codeSetSeparator.character).concat(codesToAdd);
        $codeSet.val(newCodeSet.join(codeSetSeparator.character));
        updateFromCodeSet(newCodeSet);
      }
    })
    .on('click', '.removeParentCode', (event) => {
      const codeToRemove = $(event.currentTarget).data('code');
      const newCodeSet = $codeSet.val().trim().split(codeSetSeparator.character).filter(item => item !== codeToRemove);
      $codeSet.val(newCodeSet.join(codeSetSeparator.character));
      updateFromCodeSet(newCodeSet);
    })
    .on('change', '#unfoundCodeCheckAll', (event) => {
      $('.unfoundCode').prop('checked', event.currentTarget.checked);
    })
    .on('click', '.removeSelectedUnfoundCodes', () => {
      const codesToRemove = $('input.unfoundCode:checked').map((i, v) => v.value).get();
      if (codesToRemove.length === 0) {
        alert('No codes appear to be selected. Please try again.');
      } else {
        const newCodeSet = $codeSet.val().trim().split(codeSetSeparator.character).filter(item => codesToRemove.indexOf(item) < 0);
        $codeSet.val(newCodeSet.join(codeSetSeparator.character));
        updateFromCodeSet(newCodeSet);
      }
    });

  $codeSet.on('paste', () => {
    $results.html(ajaxLoaderTemplate());
    $separatorForm.show();
    currentTerminology = $('input[name=terminology]:checked').val();
    setTimeout(() => {
      if ($codeSet.val().trim().indexOf('\t') > -1) codeSetSeparator = separators.tab;
      else if ($codeSet.val().trim().indexOf(',') > -1) codeSetSeparator = separators.comma;
      else codeSetSeparator = separators.newline;
      updateSeparatorRadio();
      const codeSet = $codeSet.val().trim().split(codeSetSeparator.character).filter(v => v.replace(/ /g, '').length > 0);
      updateFromCodeSet(codeSet);
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
