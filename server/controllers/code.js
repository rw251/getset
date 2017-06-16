/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const Code = require('../models/Code');

// This will need optimising at some point
// but while small scale it is a good optimisation
const cache = {};

/**
 * @description For a given searchterm and terminology this returns all
 * codes that match the searchterm in that terminology. It also returns
 * the descendants of any matched term .
 *
 * @param {string} searchterm The term to search for e.g. 'diabetes'
 * @param {string} terminology The terminology e.g. 'Readv2', 'snomed'
 * @param {function} callback Called on completion or error (err, output) => {}
 * @returns {any} No return
 */
const findCodesForTerm = (searchterm, terminology, callback) => {
  if (!cache[terminology]) cache[terminology] = {};
  if (cache[terminology][searchterm]) {
    // We've already done this so return from cache
    return callback(null, cache[terminology][searchterm]);
  }
  const escapedTerm = `\"${searchterm}\"`;
  return Code.find({ $text: { $search: escapedTerm } }, (errFirst, codes) => {
    if (errFirst) {
      return callback(errFirst);
    }
    const codesForQuery = codes.map((v) => {
      if (terminology === 'Readv2') {
        return v._id.substr(0, 5);
      }
      return v._id;
    });
    const codesForNotQuery = codes.map(v => v._id);
    const query = { $and: [
        // matches all descendents of the codes already found
        { p: { $in: codesForQuery } },
        // but doesn't match any of the original codes
        { _id: { $not: { $in: codesForNotQuery } } },
    ] };
    return Code.find(query, (errSecond, allCodes) => {
      if (errSecond) {
        return callback(errSecond);
      }
      cache[terminology][searchterm] = allCodes.concat(codes);
      return callback(null, cache[terminology][searchterm]);
    });
  });
};


/**
 * @description Merges an array of results into the current cached object
 *
 * @param {object} cur The current object of results
 * @param {array} result The array of results to add to the object
 * @returns {null} No result
 */
const mergeResults = (cur, result) => {
  result.forEach((r) => {
    cur[r._id] = r;
  });
};


/**
 * @description Converts an object with key value pairs into an array of values
 *
 * @param {object} obj The object to arrayify
 * @returns {array} The array of the object's values
 */
const toArray = obj => Object.keys(obj).map(v => obj[v]);


/**
 * @description Takes a list of search terms and returns the combined set of matching
 * codes for each search term combined.
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.searchMultiple = (req, res) => {
  const terms = [].concat(req.query.t);
  let hasErrorOccurred = false;
  let hasReturned = 0;
  const toReturn = {};
  terms.forEach((t) => {
    findCodesForTerm(t, req.params.terminology, (err, result) => {
      hasReturned += 1;
      if (!hasErrorOccurred) {
        if (err) {
          hasErrorOccurred = true;
          req.log(err);
          res.send();
        } else {
          mergeResults(toReturn, result);
          if (hasReturned === terms.length) {
            res.send({
              codes: toArray(toReturn),
              timestamp: Date.now(),
              searchTerm: terms.map(term => term.toLowerCase()),
            });
          }
        }
      }
    });
  });
};

/**
 * @description Takes a single search term and returns the set of matching
 * codes.
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.search = (req, res) => {
  const searchTerm = req.params.searchterm;
  findCodesForTerm(searchTerm, req.params.terminology, (err, result) => {
    if (err) {
      req.log(err);
      return res.send();
    }
    return res.send({
      codes: result,
      timestamp: Date.now(),
      searchTerm,
    });
  });
};

const frequencyOfTerm = term => new Promise((resolve, reject) => {
  const rtnTerm = term;
  if (!term.term) {
    rtnTerm = { term };
  }
  const escapedTerm = `\"${rtnTerm.term}\"`;
  Code.count({ $text: { $search: escapedTerm } }, (err, count) => {
    if (err) reject(err);
    rtnTerm.n = count;
    resolve(rtnTerm);
  });
});

const frequencyOfTerms = terms => Promise.all(terms.map(term => frequencyOfTerm(term)));

const processCodesForTerminology = (codes, terminology) => {
  if (terminology === 'Readv2') {
    return codes.map((v) => {
      if (v.length === 5) return `${v}00`;
      return v;
    });
  }
  return codes;
};

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
                          .map(k => ({ term: k, freq: allTerms[k] }))
                          .filter(k => k.freq > 1)
                          .sort((b, a) => a.freq - b.freq);
  frequencyOfTerms(allTermsArray).then((result) => {
    result.sort((b, a) => {
      if ((a.freq / a.n) === (b.freq / b.n)) {
        return a.freq - b.freq;
      }
      return (a.freq / a.n) - (b.freq / b.n);
    });
    resolve(result);
  });
});

/**
 * @description Takes a list of codes and returns a list of definitions
 *
 * @param {any} req The express request object
 * @param {any} res The express response object
 * @returns {null} No return
 */
exports.enhance = (req, res) => {
  const processedCodes = processCodesForTerminology(req.body.codes, req.body.terminology);
  Code.find({ _id: { $in: processedCodes } }, (err, codes) => {
    const returnedCodes = codes.map(v => v._id);
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
  frequencyOfTerm(req.params.term)
    .then((result) => {
      res.send(result);
    });
};

exports.freqMult = (req, res) => {
  frequencyOfTerms(req.body.terms)
    .then((terms) => {
      res.send({ n: terms });
    });
};

