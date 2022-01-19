import JSZip from 'jszip';
import page from 'page';

import convertComponent from '../components/convert';
import synonymComponent from '../components/partials/synonyms';

import defaultController from './default';
import { syncToLocal } from '../scripts/global';

const itSupportsDragging = () => {
  const div = document.createElement('div');
  return 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
};

const itSupportsFileReader = () => 'FileReader' in window;

const itSupportsFormData = () => 'FormData' in window;

const itSupportsDragDropUpload = () =>
  itSupportsDragging() && itSupportsFileReader() && itSupportsFormData();
const currentCodeSet = {};
const $synonym = { include: {}, exclude: {} };
const $terminologyRadio = {};

const readMetaDataFile = (fileContent) => {
  let fileJson = {};
  try {
    fileJson = JSON.parse(fileContent);
  } catch (err) {
    console.error(err);
    console.error('Your metadata file is not in JSON format.');
    return;
  }
  if (!fileJson.includeTerms) {
    console.error('Your metadata file does not contain a property "includeTerms".');
    return;
  }
  if (!fileJson.excludeTerms) {
    console.error('Your metadata file does not contain a property "excludeTerms".');
    return;
  }
  if (!fileJson.terminology) {
    console.error('Your metadata file does not contain a property "terminology".');
    return;
  }
  currentCodeSet.s = {};
  currentCodeSet.e = {};
  fileJson.includeTerms.forEach((term) => {
    currentCodeSet.s[term] = true;
  });
  fileJson.excludeTerms.forEach((term) => {
    currentCodeSet.e[term] = true;
  });
  currentCodeSet.terminology = fileJson.terminology;
  currentCodeSet.createdOn = fileJson.createdOn;
  currentCodeSet.createdBy = fileJson.createdBy;
};

const readCodeSetFile = (fileContent) => {
  currentCodeSet.codes = fileContent.split('\n');
};

const refreshSynonymUI = () => {
  const html = synonymComponent({ synonym: Object.keys(currentCodeSet.s) });
  $synonym.include.list.html(html);
};

const refreshExclusionUI = () => {
  const html = synonymComponent({ synonym: Object.keys(currentCodeSet.e) });
  $synonym.exclude.list.html(html);
};

const refreshTerminologyUI = () => {
  $terminologyRadio[currentCodeSet.terminology].prop('checked', true);
};

const refreshTermUI = () => {
  refreshSynonymUI();
  refreshExclusionUI();
  refreshTerminologyUI();
};

const wireup = () => {
  $synonym.include.list = $('#synonymList');
  $synonym.exclude.list = $('#exclusionList');
  $('input[name="terminology"]').each((idx, el) => {
    $terminologyRadio[el.value] = $(el);
  });
  // applying the effect for every form

  $('.box').each(function wireUpBox() {
    const $form = $(this);
    const $input = $form.find('input[type="file"]');
    const $errorMsg = $form.find('.box__error span');
    const $restart = $form.find('.box__restart');
    const $edit = $form.find('.edit-file');
    const itSupportsWhatWeNeed = itSupportsDragDropUpload();
    let droppedFiles = false;

    // automatically submit the form on file select
    $input.on('change', (evt) => {
      droppedFiles = evt.target.files;
      $form.trigger('submit');
    });

    // drag&drop files if the feature is available
    if (itSupportsWhatWeNeed) {
      $form
        .addClass('has-advanced-upload') // letting the CSS part to know drag&drop is supported by the browser
        .on('drag dragstart dragend dragover dragenter dragleave drop', (evt) => {
          // preventing the unwanted behaviours
          evt.preventDefault();
          evt.stopPropagation();
        })
        .on('dragover dragenter', () => {
          $form.addClass('is-dragover');
        })
        .on('dragleave dragend drop', () => {
          $form.removeClass('is-dragover');
        })
        .on('drop', (evt) => {
          droppedFiles = evt.originalEvent.dataTransfer.files; // the files that were dropped
          $form.trigger('submit'); // automatically submit the form on file drop
        });
    }

    const displayError = (error, friendlyMessage) => {
      console.error(error);
      $errorMsg.text(friendlyMessage);
      $form.removeClass('is-uploading').addClass('is-error');
    };

    // if the form was submitted
    $form.on('submit', (evt) => {
      // preventing the duplicate submissions if the current one is in progress
      if ($form.hasClass('is-uploading')) return false;

      // some edge cases lead to this occurring when the user clicks cancel in the file picker
      if (!droppedFiles || droppedFiles.length === 0) return false;

      $form.addClass('is-uploading').removeClass('is-error');

      evt.preventDefault();

      const files = droppedFiles;
      const reader = new FileReader();
      reader.onload = function readerOnLoad() {
        $form.removeClass('is-uploading'); // .removeClass('is-error');
        const newZip = new JSZip();
        // more files !
        newZip
          .loadAsync(reader.result)
          .then((zip) => {
            // you now have every files contained in the loaded zip
            if (!zip) displayError(null, 'No zip file found.');
            else if (!zip.files || Object.keys(zip.files).length !== 2)
              displayError(null, 'Zip file should contain two files.');
            else if (
              Object.keys(zip.files).filter((v) => v.toLowerCase().indexOf('metadata') > -1)
                .length !== 1
            ) {
              displayError(null, "Need precisely one file with 'metadata' in it's name.");
            } else {
              const metadataFilename = Object.keys(zip.files).filter(
                (v) => v.toLowerCase().indexOf('metadata') > -1
              )[0];
              const codesetFilename = Object.keys(zip.files).filter(
                (v) => v.toLowerCase().indexOf('metadata') === -1
              )[0];

              const metaDataPromise = zip.file(metadataFilename).async('string');
              const codeSetPromise = zip.file(codesetFilename).async('string');

              Promise.all([metaDataPromise, codeSetPromise])
                .then((fileContents) => {
                  readMetaDataFile(fileContents[0]);
                  readCodeSetFile(fileContents[1]);
                  refreshTermUI();
                  $form.addClass('is-success').removeClass('is-uploading').removeClass('is-error');
                })
                .catch((err) => {
                  $errorMsg.text(err);
                  $form.removeClass('is-uploading').addClass('is-error');
                });
            }
          })
          .catch((err) => {
            displayError(err, 'Was that a zip file?');
          });
      };
      return reader.readAsArrayBuffer(files[0]);
    });

    // restart the form if has a state of error/success

    $restart.on('click', (evt) => {
      evt.preventDefault();
      $form.removeClass('is-error');
      $input.trigger('click');
    });

    // edit the loaded file
    $edit.on('click', (evt) => {
      evt.preventDefault();
      const { e, s } = currentCodeSet;
      syncToLocal({ e, s }, () => {
        page('/create');
      });
    });

    // Firefox focus bug fix for file input
    $input
      .on('focus', () => {
        $input.addClass('has-focus');
      })
      .on('blur', () => {
        $input.removeClass('has-focus');
      });
  });
};

const show = () => {
  defaultController(convertComponent);
  wireup();
};
// params, state, url
export { show as default };
