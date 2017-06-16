const enhanceTemplate = require('../../shared/templates/enhance.jade');
// const codeListTemplate = require('../../shared/templates/partials/code-list.jade');
const enhanceResultsTemplate = require('../../shared/templates/enhanceResults.jade');
const ajaxLoaderTemplate = require('../../shared/templates/ajaxLoader.jade');
// const graphUtils = require('../scripts/graph-utils');
const defaultController = require('./default');
const $ = require('jquery');

let $output;
let $codeSet;
let currentTerminology = '';
const stopWords = ['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's", 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'];

const getWordFrequency = (codes, n) => new Promise((resolve) => {
  const allTerms = {};
  codes.forEach((v) => {
    const localTerms = {};

    v.t.split('|').forEach((vv) => {
      const words = vv.split(/\s+/);
      for (let i = 0; i < words.length; i += 1) {
        for (let j = Math.max(0, i - n + 1); j <= i; j += 1) {
          if (j === i) {
            if (stopWords.indexOf(words[i]) === -1) {
              localTerms[words[i]] = 1;
            }
          } else {
            localTerms[words.slice(j, i + 1).join(' ').toLowerCase()] = 1;
          }
        }
      }
    });

    Object.keys(localTerms).forEach((vv) => {
      if (allTerms[vv]) allTerms[vv] += 1;
      else allTerms[vv] = 1;
    });
  });
  const allTermsArray = Object
                          .keys(allTerms)
                          .map(k => ({ term: k, n: allTerms[k] }))
                          .filter(k => k.n > 1)
                          .sort((b, a) => a.n - b.n);
  resolve(allTermsArray);
});

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
          // getWordFrequency(data.codes, 3).then((freq) => {
            // data.codeFrequency = freq;
          $output.fadeOut(500, () => {
            $output.html(enhanceResultsTemplate(data)).fadeIn(300);
          });
            /* freq.forEach((v, i) => {
              $
                .ajax({
                  type: 'GET',
                  url: `/code/freq/${v.term}`,
                  dataType: 'json',
                  contentType: 'application/json',
                })
                .done((termFreq) => {
                  const $cell = $(`#freq${i}`);
                  $cell.text(termFreq.n);
                  $cell.next().text(termFreq.n - +$cell.prev().text());
                });
            });*/
          // });
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
