/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const Code = require('../models/Code')('Readv2');
const db = require('./db');
const pino = require('pino')();
const termSvc = require('../services/terminology.js');

const BIT_LENGTH = 6;
// This will need optimising at some point
// but while small scale it is a good optimisation

// from https://stackoverflow.com/a/6969486/596639
const escapeRegExp = (str) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

/**
 * @description Takes a list of search terms and returns the combined set of matching
 * codes for each search term combined.
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.searchMultiple = async (req, res) => {
  const inclusionTerms = req.body.terms;
  // const exclusionTerms = req.body.exclusionTerms || [];
  const { terminology, version } = req.body;

  const terms = termSvc.getObject(inclusionTerms);

  const rtn = await db.searchMultiple(terminology, version, terms).catch((e) => {
    pino.error(e);
    res.status(500);
    return { message: 'error' };
  });
  res.send(rtn);

  // let hasErrorOccurred = false;
  // let hasReturned = 0;
  // const toReturn = {};
  // inclusionTerms.forEach((t) => {
  //   findCodesForTerm(t, terminology, (err, result) => {
  //     hasReturned += 1;
  //     if (!hasErrorOccurred) {
  //       if (err) {
  //         hasErrorOccurred = true;
  //         req.log(err);
  //         res.send();
  //       } else {
  //         mergeResults(toReturn, result);
  //         if (hasReturned === inclusionTerms.length) {
  //           res.send({
  //             codes: toArray(toReturn),
  //             timestamp: Date.now(),
  //             searchTerm: inclusionTerms.map(term => term.toLowerCase()),
  //           });
  //         }
  //       }
  //     }
  //   });
  // });
};

const frequencyOfTerm = (term) =>
  new Promise((resolve, reject) => {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > frequencyOfTerm');
    let rtnTerm = term;
    if (!term.term) {
      rtnTerm = { term };
    }
    // const escapedTerm = `\"${rtnTerm.term}\"`;
    const bit = rtnTerm.term.substr(0, BIT_LENGTH).toLowerCase();
    let match = { c: bit };
    if (bit.length < BIT_LENGTH) {
      const reg = new RegExp(`^${escapeRegExp(bit)}`);
      match = { c: reg };
    }
    const wholeReg = new RegExp(escapeRegExp(rtnTerm.term), 'i');
    const aggregate = [
      { $match: match },
      { $match: { t: wholeReg } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ];

    // { $text: { $search: escapedTerm } }
    Code.aggregate(aggregate, (err, result) => {
      if (err) reject(err);
      if (result && result.length > 0) rtnTerm.n = result[0].count;
      else rtnTerm.n = 0;
      resolve(rtnTerm);
    });
  });

// TODO can perhaps make multiple frequency count quicker like this..
/* const frequencyOfTermsAlt = terms => new Promise((resolve, reject) => {
  const bits = terms.map((v) => {
    if (!v.term) v = { term: v };
    if (v.term.length < BIT_LENGTH) {
      return new RegExp(`^${escapeRegExp(v.term)}`);
    }
    return v.term.substr(0, BIT_LENGTH).toLowerCase();
  });
  const wholeReg = terms.map(v => new RegExp(escapeRegExp(v.term), 'i'));
  const aggregate = [
    { $match: { c: { $in: bits } } },
    { $match: { t: { $in: wholeReg } } },
  ];

  // { $text: { $search: escapedTerm } }
  Code.aggregate(aggregate, (err, results) => {
    if (err) reject(err);
    if (results && results.length > 0)rtnTerm.n = result[0].count;
    else rtnTerm.n = 0;
    resolve(rtnTerm);
  });
}); */

const frequencyOfTerms = (terms) => Promise.all(terms.map((term) => frequencyOfTerm(term)));

const processCodesForTerminology = (codes, terminology) => {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > processCodesForTerminology');
  if (terminology === 'Readv2') {
    return codes.map((v) => {
      if (v.length === 5) return `${v}00`;
      return v;
    });
  }
  return codes;
};

const stopWords = [
  'a',
  'about',
  'above',
  'after',
  'again',
  'against',
  'all',
  'am',
  'an',
  'and',
  'any',
  'are',
  "aren't",
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'below',
  'between',
  'both',
  'but',
  'by',
  "can't",
  'cannot',
  'could',
  "couldn't",
  'did',
  "didn't",
  'do',
  'does',
  "doesn't",
  'doing',
  "don't",
  'down',
  'during',
  'each',
  'few',
  'for',
  'from',
  'further',
  'had',
  "hadn't",
  'has',
  "hasn't",
  'have',
  "haven't",
  'having',
  'he',
  "he'd",
  "he'll",
  "he's",
  'her',
  'here',
  "here's",
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  "how's",
  'i',
  "i'd",
  "i'll",
  "i'm",
  "i've",
  'if',
  'in',
  'into',
  'is',
  "isn't",
  'it',
  "it's",
  'its',
  'itself',
  "let's",
  'me',
  'more',
  'most',
  "mustn't",
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'ought',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'same',
  "shan't",
  'she',
  "she'd",
  "she'll",
  "she's",
  'should',
  "shouldn't",
  'so',
  'some',
  'such',
  'than',
  'that',
  "that's",
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  "there's",
  'these',
  'they',
  "they'd",
  "they'll",
  "they're",
  "they've",
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  "wasn't",
  'we',
  "we'd",
  "we'll",
  "we're",
  "we've",
  'were',
  "weren't",
  'what',
  "what's",
  'when',
  "when's",
  'where',
  "where's",
  'which',
  'while',
  'who',
  "who's",
  'whom',
  'why',
  "why's",
  'with',
  "won't",
  'would',
  "wouldn't",
  'you',
  "you'd",
  "you'll",
  "you're",
  "you've",
  'your',
  'yours',
  'yourself',
  'yourselves',
];

const getWordFrequency = (codes, n) =>
  new Promise((resolve) => {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > getWordFrequency');
    const allTerms = {};
    codes.forEach((v) => {
      const localTerms = {};

      v.t.split('|').forEach((vv) => {
        const words = vv.split(/\s+/).map((w) => w.toLowerCase());
        for (let i = 0; i < words.length; i += 1) {
          if (
            stopWords.indexOf(words[i].replace(/[^a-z0-9]/g, '')) === -1 &&
            words[i].replace(/[^a-z0-9]/g, '').length > 0
          ) {
            for (let j = Math.max(0, i - n + 1); j <= i; j += 1) {
              if (
                stopWords.indexOf(words[j].replace(/[^a-z0-9]/g, '')) === -1 &&
                words[j].replace(/[^a-z0-9]/g, '').length > 0
              ) {
                if (j === i) {
                  localTerms[words[i].replace(/,$/, '')] = 1;
                } else {
                  localTerms[
                    words
                      .slice(j, i + 1)
                      .join(' ')
                      .replace(/,$/, '')
                  ] = 1;
                }
              }
            }
          }
        }
      });

      Object.keys(localTerms).forEach((vv) => {
        if (allTerms[vv]) allTerms[vv] += 1;
        else allTerms[vv] = 1;
      });
    });
    const allTermsArray = Object.keys(allTerms)
      .map((k) => ({ term: k, freq: allTerms[k] }))
      .filter((k) => k.freq > 1)
      .sort((b, a) => a.freq - b.freq);
    frequencyOfTerms(allTermsArray).then((result) => {
      result.sort((b, a) => {
        if (2 * a.freq - a.n === 2 * b.freq - b.n) {
          return a.freq - b.freq;
        }
        return 2 * a.freq - a.n - (2 * b.freq - b.n);
      });
      resolve(result);
    });
  });

/**
 * @description Takes a list of codes and returns a list of descendants not in the initial list
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.unmatchedChildren = async (req, res) => {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > unmatchedChildren');
  const { codes, terminology } = req.body;
  const processedCodes = processCodesForTerminology(codes, terminology);

  const codesToReturn = await Code.find(
    { '_id.c': { $in: processedCodes }, '_id.d': req.body.terminology },
    { c: 0 }
  )
    .lean({ virtuals: true })
    .exec();

  const returnedCodes = codesToReturn.map((v) => v.clinicalCode);
  const unfoundCodes = [];
  processedCodes.forEach((v) => {
    if (returnedCodes.indexOf(v) < 0) {
      unfoundCodes.push(v);
    }
  });
  const codesForQuery = processedCodes.map((v) => {
    if (req.body.terminology === 'Readv2') {
      return v.substr(0, 5);
    }
    return v;
  });

  const query = {
    $and: [
      // matches all descendants of the codes already found
      { a: { $in: codesForQuery } },
      // but doesn't match any of the original codes
      {
        '_id.c': { $not: { $in: processedCodes } },
        '_id.d': req.body.terminology,
      },
    ],
  };
  const unmatchedCodes = await Code.find(query, { c: 0 }).lean({ virtuals: true }).exec();
  res.send({ codes: codesToReturn, unfoundCodes, unmatchedCodes });
};

/**
 * @description Takes a list of codes and returns a list of definitions
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.enhance = (req, res) => {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > enhance');
  const processedCodes = processCodesForTerminology(req.body.codes, req.body.terminology);
  Code.find({ _id: { $in: processedCodes } }, { c: 0, a: 0, p: 0 }, (err, codes) => {
    const returnedCodes = codes.map((v) => v._id);
    const unfoundCodes = [];
    processedCodes.forEach((v) => {
      if (returnedCodes.indexOf(v) < 0) {
        unfoundCodes.push(v);
      }
    });
    getWordFrequency(codes, 3).then((codeFrequency) => {
      res.send({ codes, unfoundCodes, codeFrequency });
    });
  });
};

exports.freq = (req, res) => {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > freq');
  frequencyOfTerm(req.params.term).then((result) => {
    res.send(result);
  });
};

exports.freqMult = (req, res) => {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> code.js > freqMult');
  frequencyOfTerms(req.body.terms).then((terms) => {
    res.send({ n: terms });
  });
};
