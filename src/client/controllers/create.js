import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Clusterize from 'clusterize.js';
import api from '../scripts/api';
import createComponent from '../components/create';
import createResultsComponent from '../components/createResults';
import ajaxLoaderComponent from '../components/ajaxLoader';
import synonymComponent from '../components/partials/synonyms';
import { getHierarchies } from '../scripts/graph-utils';
import { syncFromLocal, syncToLocal } from '../scripts/global';
import state from '../scripts/state';
import { getCodeForTerminology, getSelectedText, getSelectionCoords } from '../scripts/utils';
import notification from '../scripts/notification';
import defaultController from './default';

// Add a case insensitive contains
$.expr[':'].icontains = (a, i, m) => $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;

let zeroTime;
const resetProgress = () => {
  zeroTime = null;
};
const progress = (name) => {
  if (!zeroTime) zeroTime = new Date();
  const notif = `Progress: ${name}\nElapsed time:${new Date() - zeroTime}`;
  notification(notif);
};

const $synonym = { include: {}, exclude: {} };
let $results;
let $status;
let startedAt;

let currentGroups = { excluded: [] };

let currentTerminology = '';
let currentVersion = '';

let s = {};
let e = {};

const reset = () => {
  currentGroups = { excluded: [] };

  currentTerminology = '';
  currentVersion = '';

  s = {};
  e = {};
};

const getMetaDataFileContent = (propArray) => {
  const nowish = new Date();
  const metadata = {
    includeTerms: Object.keys(s),
    excludeTerms: Object.keys(e),
    terminology: currentTerminology,
    version: currentVersion,
  };
  if (state.user) {
    metadata.createdBy = {};
    if (state.user.profile && state.user.profile.name)
      metadata.createdBy.name = state.user.profile.name;
    if (state.user.email) metadata.createdBy.email = state.user.email;
  }
  if (propArray && propArray.length > 0) {
    propArray.forEach((prop) => {
      metadata[prop.name] = prop.value;
    });
  }
  metadata.createdOn = currentGroups.githubSet ? currentGroups.githubSet.createdOn : nowish;
  metadata.lastUpdated = nowish;
  return metadata;
};
const getMetaDataFile = (propArray) => {
  const metadata = getMetaDataFileContent(propArray);
  const blob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  return blob;
};
const getCodeSetFileContent = () => {
  const currentCodeSet = [];
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      if (!currentGroups.matched[gi][i].exclude) {
        currentCodeSet.push(code.code || code.clinicalCode);
      }
    });
  });
  return currentCodeSet;
};
const getCodeSetFileContentWithDefinitions = () => {
  const currentCodeSet = [];
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      if (!currentGroups.matched[gi][i].exclude) {
        currentCodeSet.push({ code: code.code || code.clinicalCode, definition: code.description });
      }
    });
  });
  return currentCodeSet;
};
const getCodeSetFile = () => {
  const currentCodeSet = getCodeSetFileContent();
  const blob = new Blob([currentCodeSet.join('\r\n')], { type: 'text/plain;charset=utf-8' });
  return blob;
};
const getCodeSetFileWithDefinitions = () => {
  const currentCodeSet = getCodeSetFileContentWithDefinitions();
  const blob = new Blob([currentCodeSet.map((x) => `${x.code}\t${x.definition}`).join('\r\n')], {
    type: 'text/plain;charset=utf-8',
  });
  return blob;
};
const triggerDownload = (file, name) => {
  saveAs(file, name);
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

const makeDirty = () => {
  if (!currentGroups.githubSet) return;
  currentGroups.isDirty = true;
  $('#savedToGithub').replaceWith(
    '<button class="btn btn-warning" id="updateGit" type="button">Save</button>'
  );
};

const wireUpButtonsAndModal = () => {};

const $scroll = {};
const $content = {};
const $headers = {};

/**
 * Makes header columns equal width to content columns
 */
const fitHeaderColumns = (() => {
  let prevWidth = [];
  return (table) => {
    const $firstRow = $content[table].find('tr:not(.clusterize-extra-row):first');
    const columnsWidth = [];
    $firstRow.children().each(function childEach() {
      columnsWidth.push($(this).width());
    });
    if (columnsWidth.filter((x) => x < 0).length > 0) {
      prevWidth = columnsWidth;
      // looks like not rendered yet, try again in a bit
      return setTimeout(() => {
        fitHeaderColumns(table);
      }, 100);
    }
    if (columnsWidth.toString() !== prevWidth.toString()) {
      $headers[table]
        .find('tr')
        .children()
        .each(function (i) {
          $(this).width(columnsWidth[i]);
        });
      prevWidth = columnsWidth;
    }
  };
})();
/**
 * Keep header equal width to tbody
 */
const setHeaderWidth = (table) => {
  $headers[table].width($content[table].width());
};

const tableHtml = {};
let matchedContentForCopying = [];
const populateTableData = (groups) => {
  tableHtml.matchedTabContent = groups.matched.map((subgraph) =>
    subgraph
      .filter((item) => !item.exclude && !item.excludedByParent)
      .map(
        (item) =>
          `<tr><td class='disable-select'>${item.code}</td><td>${item.description}</td><td class='disable-select'>${item.depth}</td><td class='disable-select'></td></tr>`
      )
  );
  matchedContentForCopying = [].concat(
    ...groups.matched.map((subgraph) =>
      subgraph
        .filter((item) => !item.exclude && !item.excludedByParent)
        .map((item) => `${item.code}\t${item.description}`)
    )
  );
  tableHtml.matchedDescendantButNotMatchedTabContent = groups.unmatched.map((subgraph) =>
    subgraph
      .filter((item) => !item.exclude && !item.excludedByParent)
      .map(
        (item) =>
          `<tr><td class='disable-select'>${item.code}</td><td>${item.description}</td><td class='disable-select'>${item.depth}</td><td class='disable-select'></td></tr>`
      )
  );
  tableHtml.excludedTabContent = groups.excluded.map(
    (code) =>
      `<tr><td class='disable-select'>${code.clinicalCode || code.code}</td><td>${
        code.t || code.description
      }</td><td class='disable-select'>${code.a}</td><td class='disable-select'>${code.p}</td></tr>`
  );

  // flatten array
  tableHtml.matchedTabContent = [].concat(...tableHtml.matchedTabContent);
  tableHtml.matchedDescendantButNotMatchedTabContent = [].concat(
    ...tableHtml.matchedDescendantButNotMatchedTabContent
  );

  // const unmatchingCodesTableHtml = rowsForTableFromGraphTemplate(groups.unmatched);
  // const excludedCodesTableHtml = rowsForTableFromCodesTemplate(groups.excluded);

  const tabs = [
    'matchedTabContent',
    'matchedDescendantButNotMatchedTabContent',
    'excludedTabContent',
  ];

  tabs.forEach((tab) => {
    $scroll[tab] = $(`#scroll-${tab}`);
    $content[tab] = $(`#content-${tab}`);
    $headers[tab] = $(`#headers-${tab}`);

    new Clusterize({
      rows: tableHtml[tab],
      scrollId: `scroll-${tab}`,
      contentId: `content-${tab}`,
      callbacks: {
        clusterChanged() {
          fitHeaderColumns(tab);
          setHeaderWidth(tab);
        },
      },
    });
  });
};

const displayResults = (groups) => {
  progress('displayResults called');
  if (state.user) groups.user = state.user;
  else delete groups.user;

  // Skeleton html - doesn't have table data
  const html = createResultsComponent(groups);

  // It was really quick so just show it
  if (new Date() - startedAt < 150) {
    $results.html(html);
    populateTableData(groups);
    wireUpButtonsAndModal();
  } else {
    // It's taken a bit of time so do a fadeOut
    $results.fadeOut(500, () => {
      $results.html(html).fadeIn(300);
      populateTableData(groups);
      wireUpButtonsAndModal();
    });
  }
  progress('displayResults ended');
};

const saveToGithub = () => {
  const metadata = getMetaDataFileContent($('#saveModal form').serializeArray());
  const codeSet = getCodeSetFileContent();
  const commitMessage = metadata.message;
  delete metadata.message;
  const metadataFileContent = JSON.stringify(metadata, null, 2);
  const codeSetFileContent = codeSet.join('\r\n');
  const dataToSend = {
    metadataFileContent,
    codeSetFileContent,
    name: metadata.name,
    description: metadata.description,
    message: metadata.description,
  };
  if (currentGroups.githubSet) {
    dataToSend.codeSet = currentGroups.githubSet;
    dataToSend.message = commitMessage;
  }
  api
    .saveToGithub(dataToSend)
    .then((set) => {
      currentGroups.githubSet = set;
      currentGroups.isDirty = false;
      $('#saveModal').modal('hide');
      displayResults(currentGroups);
    })
    .catch(() => {
      alert(
        "Something went wrong and your code set is not saved. Feel free to try again but I'm not very hopeful."
      );
    });
};

const refreshExclusion = () => {
  progress('refreshExclusion called');
  const excludedTerms = Object.keys(e);
  const includedTerms = Object.keys(s).map((t) => t.toLowerCase());
  currentGroups.excluded = [];

  // update the excluded codes for the set of matched codes
  // unless the term is matched exactly by an inclusion term
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      const isInExcludedTerms =
        excludedTerms.filter((a) => {
          if (a[0] === '"' && a[a.length - 1] === '"') {
            return new RegExp(`\\b${a.substr(1, a.length - 2).toLowerCase()}\\b`).test(
              code.description.toLowerCase()
            );
          }
          return code.description.toLowerCase().indexOf(a.toLowerCase()) > -1;
        }).length > 0;
      const isExactInclusionMatch =
        includedTerms.indexOf(code.description.toLowerCase()) > -1 || // without quotes
        includedTerms.indexOf(`"${code.description.toLowerCase()}"`) > -1; // with quotes
      if (isInExcludedTerms && !isExactInclusionMatch) {
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
  // exclude if:
  //  - matches an exclusion term
  currentGroups.unmatched.forEach((g, gi) => {
    g.forEach((code, i) => {
      const isInExcludedTerms =
        excludedTerms.filter((a) => {
          if (a[0] === '"' && a[a.length - 1] === '"') {
            return new RegExp(`\\b${a.substr(1, a.length - 2).toLowerCase()}\\b`).test(
              code.description.toLowerCase()
            );
          }
          return code.description.toLowerCase().indexOf(a.toLowerCase()) > -1;
        }).length > 0;
      if (isInExcludedTerms) {
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

  // Cache matched ancestors to increase speed later on
  const matchedCodes = {};
  currentGroups.matched.forEach((a) => {
    a.forEach((b) => {
      matchedCodes[getCodeForTerminology(b.code, currentTerminology)] = true;
    });
  });

  // Cache excluded ancestors to increase speed later on
  const excludedCodes = {};
  currentGroups.excluded.forEach((a) => {
    excludedCodes[getCodeForTerminology(a.code, currentTerminology)] = true;
  });

  // finally, add to the exclude list any unmatched items who have:
  //  - are a descendant of a matched code with an excluded ancestor
  //  - are not a descendant of a matched code AND is a synonym for an excluded code
  currentGroups.unmatched.forEach((g, gi) => {
    g.forEach((code, i) => {
      const hasExcludedParent = code.ancestors.filter((a) => excludedCodes[a]).length > 0; // / IMPROVE 2
      const hasNoMatchedParent = code.ancestors.filter((a) => matchedCodes[a]).length === 0; // / IMPROVE 1
      const isSynonymForExcludedCode = excludedCodes[code.code.substr(0, 5)]; // IMPROVE 3
      if (hasExcludedParent || (hasNoMatchedParent && isSynonymForExcludedCode)) {
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
  progress('refreshExclusion ended');
};

const refresh = () => {
  $status.text('Refreshing list...');
  $results.html(ajaxLoaderComponent());
  const [id, version] = document.querySelector('select[name=terminology]').value.split('-');
  currentTerminology = id;
  currentVersion = version;
  setTimeout(() => {
    const terms = Object.keys(s);
    api.codeSearch(terms, currentTerminology, currentVersion).then((data) => {
      $status.text(`Result! (n=${data.codes.length})`);
      const hierarchies = getHierarchies(data.codes, currentTerminology, terms);
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
  const html = synonymComponent({ synonyms: Object.keys(s) });
  $synonym.include.list.html(html);
  clearInputs();
};

const refreshExclusionUI = () => {
  progress('refreshExclusionUI called');
  const html = synonymComponent({ synonyms: Object.keys(e) });
  $synonym.exclude.list.html(html);
  clearInputs();
  progress('refreshExclusionUI ended');
};

const localSyncToLocal = () => {
  syncToLocal({ s, e });
};

const addExclusion = (term) => {
  e[term] = true;
  localSyncToLocal();
};

const addInclusion = (term) => {
  s[term] = true;
  localSyncToLocal();
};

const removeExclusion = (term) => {
  delete e[term];
  localSyncToLocal();
  refreshExclusion();
};

const removeInclusion = (term) => {
  delete s[term];
  localSyncToLocal();
  if (Object.keys(s).length > 0) refresh();
};

const removeTerm = (term) => {
  if (e[term]) {
    removeExclusion(term);
  } else {
    removeInclusion(term);
  }
};

const updateUI = () => {
  refreshExclusionUI();
  refreshSynonymUI();
  refresh();

  $('.alert')
    .alert()
    .on('closed.bs.alert', (evt) => {
      makeDirty();
      const termToRemove = $(evt.target).data('value');
      removeTerm(termToRemove);
    });
};

const localSyncFromLocal = () => {
  syncFromLocal((o) => {
    ({ e, s } = o);
    if (Object.keys(e).length + Object.keys(s).length > 0) updateUI();
  });
};

const addTerm = (term, isExclusion) => {
  resetProgress();
  progress('addTerm called');
  makeDirty();
  const lowerCaseTerm = term.toLowerCase();
  startedAt = new Date();
  if (isExclusion) {
    addExclusion(lowerCaseTerm);
    refreshExclusionUI();
    setTimeout(() => refreshExclusion(), 0);
  } else {
    addInclusion(lowerCaseTerm);
    refreshSynonymUI();
    setTimeout(() => refresh(), 0);
  }

  $('.alert')
    .alert()
    .on('closed.bs.alert', (evt) => {
      makeDirty();
      const termToRemove = $(evt.target).data('value');
      removeTerm(termToRemove);
    });
  progress('addTerm ended');
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

  let isCtrlPressed = false;
  $(document)
    .on('keydown', (keyEvent) => {
      if (keyEvent.keyCode === 17) {
        // ctrl
        isCtrlPressed = true;
        // situations where the ctrl keyup event isn't fired, so
        // also remove the ctrl after a few seconds
        setTimeout(() => {
          isCtrlPressed = false;
        }, 5000);
      } else if (isCtrlPressed && (keyEvent.keyCode === 67 || keyEvent.keyCode === 99)) {
        // c
        // console.log(`s: ${Object.keys(s).length}, e: ${Object.keys(e).length}`);
        if (getSelectedText().toString() !== '') {
          // don't want to prevent standard ctrl-c behaviour
          return;
        }
        // do copy
        const dataToCopy = matchedContentForCopying.sort().join('\n');
        const textarea = document.createElement('textarea');
        textarea.value = dataToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          notification('Copied!');
          // console.log(`Copying was ${`${successful ? '' : 'un'}successful`}`);
        } catch (err) {
          notification('Copy failed!');
          console.error('Unable to copy');
          console.error(err);
        }
        document.body.removeChild(textarea);
      }
    })
    .on('keyup', (keyEvent) => {
      if (keyEvent.keyCode === 17) {
        // ctrl
        isCtrlPressed = false;
      }
    });

  $('.btn-remove-all').on('click', (event) => {
    makeDirty();
    if ($(event.currentTarget).data('which') === 'inclusion') {
      s = {};
      localSyncToLocal();
      $synonym.include.list.html('');
      refresh();
    } else {
      e = {};
      $synonym.exclude.list.html('');
      localSyncToLocal();
      refreshExclusion();
    }
  });

  $synonym.include.input.on('keypress', (evt) => {
    if (evt.which === 13) {
      // ENTER key
      addIfLongEnough($synonym.include.input);
      evt.preventDefault();
    }
  });

  $synonym.exclude.input.on('keypress', (evt) => {
    if (evt.which === 13) {
      // ENTER key
      addIfLongEnough($synonym.exclude.input);
      evt.preventDefault();
    }
  });

  $('#createForm').on('submit', (evt) => {
    evt.preventDefault();
  });

  document.querySelector('select[name=terminology]').addEventListener('change', () => {
    console.log('Terminology changed. Refreshing...');
    refresh();
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
    .on('shown.bs.modal', '#saveModal', () => {
      $('#firstInput').focus();
    })
    .on('submit', '#saveModal form', (evt) => {
      evt.preventDefault();
      $('#saveModal .hide-on-submit').hide();
      $('#loader').show();
      saveToGithub();
    })
    .on('shown.bs.tab', 'a[data-toggle="tab"]', (evt) => {
      [, currentGroups.selected] = evt.target.href.split('#');
      fitHeaderColumns(currentGroups.selected);
    })
    .on('mouseup', 'td', (evt) => {
      const selection = getSelectedText();
      if (selection.toString() === lastSelectedText) return;
      lastSelectedText = selection.toString();
      $synonym.include.input.val(selection);
      $synonym.exclude.input.val(selection);

      if (selection.toString().length > 0) {
        if (lastPopOverElements) {
          lastPopOverElements.popover('hide');
          lastPopOverElements = null;
        }
        const popupElement =
          '<div class="btn-group"><button class="btn btn-sm btn-success btn-include">Include</button><button class="btn btn-sm btn-danger btn-exclude">Exclude</button></div>';
        const selectionCoords = getSelectionCoords();
        $(evt.target).popover({
          animation: true,
          content: popupElement,
          container: '#results',
          html: true,
          placement: 'right',
          sanitize: false,
        });
        setTimeout(() => {
          $('.popover').css('left', selectionCoords.right + 25 - $results.offset().left);
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
      const codeSetWithDefinitions = getCodeSetFileWithDefinitions();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');

      zipFiles([
        { content: codeSet, name: `codeset.${timestamp}.txt` },
        { content: codeSetWithDefinitions, name: `codeset.with.definitions.${timestamp}.txt` },
        { content: metadata, name: `codeset.metadata.${timestamp}.json` },
      ])
        .then((file) => {
          // console.log(file);
          triggerDownload(
            new Blob([file], { type: 'application/zip' }),
            `codeset.${timestamp}.zip`
          );
        })
        .catch((err) => {
          console.error(`whoops ${err}`);
        });
    })
    .on('click', '#downloadCodes', (evt) => {
      evt.preventDefault();
      const codeSet = getCodeSetFile();
      triggerDownload(codeSet, `codeset.${new Date().toISOString().replace(/[^0-9]/g, '')}.txt`);
    })
    .on('click', '#downloadCodesWithDefinitions', (evt) => {
      evt.preventDefault();
      const codeSet = getCodeSetFileWithDefinitions();
      triggerDownload(
        codeSet,
        `codeset.with.definitions.${new Date().toISOString().replace(/[^0-9]/g, '')}.txt`
      );
    })
    .on('click', '#downloadMeta', (evt) => {
      evt.preventDefault();
      const metadata = getMetaDataFile();
      triggerDownload(
        metadata,
        `codeset.metadata.${new Date().toISOString().replace(/[^0-9]/g, '')}.json`
      );
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

const show = () => {
  reset();

  api.getTerminologies().then((terminologies) => {
    defaultController(createComponent, {
      loading: state.codeSetId && !state.currentSet,
      terminologies,
    });
    wireup();

    if (state.codeSetId && !state.currentSet) {
      api.getCodeSet(state.codeSetId).then((codeset) => {
        // save to state
        state.currentSet = codeset;
        // launch create page
        state.currentSet.metadata.includeTerms.forEach((term) => {
          addInclusion(term);
        });
        state.currentSet.metadata.excludeTerms.forEach((term) => {
          addExclusion(term);
        });
        currentGroups.githubSet = state.currentSet.githubSet;
        updateUI();
        $('.loading-overlay').fadeOut(500);
      });
    } else if (state.currentSet) {
      state.currentSet.metadata.includeTerms.forEach((term) => {
        addInclusion(term);
      });
      state.currentSet.metadata.excludeTerms.forEach((term) => {
        addExclusion(term);
      });
      currentGroups.githubSet = state.currentSet.githubSet;
      updateUI();
    } else {
      localSyncFromLocal();
    }
  });
};

export { show as default };
