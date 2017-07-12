const validateTemplate = require('../../shared/templates/validate.jade');
const defaultController = require('./default');
const $ = require('jquery');
const JSZip = require('jszip');

const itSupportsDragging = () => {
  const div = document.createElement('div');
  return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
};

const itSupportsFileReader = () => 'FileReader' in window;

const itSupportsFormData = () => 'FormData' in window;

const itSupportsDragDropUpload = () => itSupportsDragging() && itSupportsFileReader()
                                                                && itSupportsFormData();

const wireup = () => {
  // applying the effect for every form

  $('.box').each(function () {
    const $form = $(this);
    const $input = $form.find('input[type="file"]');
    const $label = $form.find('label');
    const $errorMsg = $form.find('.box__error span');
    const $restart = $form.find('.box__restart');
    let droppedFiles = false;
    const showFiles = function (files) {
      $label.text(files.length > 1 ? ($input.attr('data-multiple-caption') || '').replace('{count}', files.length) : files[0].name);
    };

      // letting the server side to know we are going to make an Ajax request
    $form.append('<input type="hidden" name="ajax" value="1" />');

      // automatically submit the form on file select
    $input.on('change', (e) => {
      showFiles(e.target.files);


      $form.trigger('submit');
    });


      // drag&drop files if the feature is available
    if (itSupportsDragDropUpload()) {
      $form
        .addClass('has-advanced-upload') // letting the CSS part to know drag&drop is supported by the browser
        .on('drag dragstart dragend dragover dragenter dragleave drop', (e) => {
          // preventing the unwanted behaviours
          e.preventDefault();
          e.stopPropagation();
        })
        .on('dragover dragenter', () => {
          $form.addClass('is-dragover');
        })
        .on('dragleave dragend drop', () => {
          $form.removeClass('is-dragover');
        })
        .on('drop', (e) => {
          droppedFiles = e.originalEvent.dataTransfer.files; // the files that were dropped
          showFiles(droppedFiles);


          $form.trigger('submit'); // automatically submit the form on file drop
        });
    }


      // if the form was submitted

    $form.on('submit', (e) => {
        // preventing the duplicate submissions if the current one is in progress
      if ($form.hasClass('is-uploading')) return false;

      $form.addClass('is-uploading').removeClass('is-error');

      if (itSupportsDragDropUpload()) { // ajax file upload for modern browsers
        e.preventDefault();

        const files = droppedFiles;
        const reader = new FileReader();
        reader.onload = function () {
          const newZip = new JSZip();
          // more files !
          newZip.loadAsync(reader.result)
            .then((zip) => {
                // you now have every files contained in the loaded zip
              if (!zip) console.log('No zip file found.');
              else if (!zip.files || Object.keys(zip.files).length !== 2) console.log('Zip file should contain two files.');
              else if (Object.keys(zip.files).filter(v => v.toLowerCase().indexOf('metadata') > -1).length !== 1) {
                console.log("Need precisely one file with 'metadata' in it's name");
              } else {
                const metadataFilename = Object.keys(zip.files).filter(v => v.toLowerCase().indexOf('metadata') > -1)[0];
                const codesetFilename = Object.keys(zip.files).filter(v => v.toLowerCase().indexOf('metadata') === -1)[0];

                zip.file(metadataFilename).async('string').then((data) => {
                  console.log(data);
                });

                zip.file(codesetFilename).async('string').then((data) => {
                  console.log(data);
                });
              }
            });
        };
        reader.readAsArrayBuffer(files[0]);
      }  // fallback Ajax solution upload for older browsers
      const iframeName = `uploadiframe${new Date().getTime()}`;
      const $iframe = $(`<iframe name="${iframeName}" style="display: none;"></iframe>`);

      $('body').append($iframe);
      $form.attr('target', iframeName);

      return $iframe.one('load', () => {
        const data = $.parseJSON($iframe.contents().find('body').text());
        $form.removeClass('is-uploading').addClass(data.success === true ? 'is-success' : 'is-error').removeAttr('target');
        if (!data.success) $errorMsg.text(data.error);
        $iframe.remove();
      });
    });


      // restart the form if has a state of error/success

    $restart.on('click', (e) => {
      e.preventDefault();
      $form.removeClass('is-error is-success');
      $input.trigger('click');
    });

      // Firefox focus bug fix for file input
    $input
      .on('focus', () => { $input.addClass('has-focus'); })
      .on('blur', () => { $input.removeClass('has-focus'); });
  });
};
// params, state, url
module.exports = {

  show: () => {
    defaultController(validateTemplate);
    wireup();
  },

};

