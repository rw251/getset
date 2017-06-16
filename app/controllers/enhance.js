const enhanceTemplate = require('../../shared/templates/enhance.jade');
const enhanceResultsTemplate = require('../../shared/templates/enhanceResults.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
const defaultController = require('./default');
const $ = require('jquery');

let $output;
let $codeSet;
let currentTerminology = '';

const wireUp = () => {
  $codeSet = $('#codeSet');
  $output = $('#results');

  $codeSet.on('paste', () => {
    $output.html(ajaxLoaderTemplate());
    currentTerminology = $('input[name=terminology]:checked').val();
    setTimeout(() => {
      const codeSet = $codeSet.val().split('\n').filter(v => v.replace(/ /g, '').length > 0);
      $
        .ajax({
          type: 'POST',
          url: '/code/enhance',
          data: JSON.stringify({ terminology: currentTerminology, codes: codeSet }),
          dataType: 'json',
          contentType: 'application/json',
        })
        .done((data) => {
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
