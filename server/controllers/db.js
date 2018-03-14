/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const Code = require('../models/Code')();

const BIT_LENGTH = 6;

// This will need optimising at some point
// but while small scale it is a good optimisation
const cache = {};

// Assumes the only regex characters are \b for word boundary and .* for wildcard
const getSearchTermFromRegex = (regex) => {
  const terms = regex
    .replace(/\\b/g, '') // get rid of the \b characters
    .replace(/\\-/g, '-') // convert escaped hypens back to hypens
    .split('.*') // split into multiple terms if wildcard exists
    .map(v => v.replace(/^ +/, '').replace(/ +$/, '')) // trim white space
    .sort((a, b) => b.length - a.length); // sort by length descending

  return terms[0];
};

// /**
//  *  For a list of terms preserving order returns the regex
//  * @param {Array} terms List of terms to get regex for.
//  * @returns {String} the regexed string.
//  */
// const getRegexForTermsPreservingOrder = terms => terms.map(getRegexForTerm).join('.*');

const getSearchQueryForSingleTerm = (regex) => {
  const searchTerm = getSearchTermFromRegex(regex);
  const bit = searchTerm.substr(0, BIT_LENGTH).toLowerCase();
  let match = { c: bit };
  if (bit.length < BIT_LENGTH) {
    const reg = new RegExp(`^${bit}`);
    match = { c: { $regex: reg } };
  }
  match.t = { $regex: new RegExp(`${regex}`, 'i') };
  return match;
};

const searchForSingleTerm = (regex) => {
  const searchQuery = getSearchQueryForSingleTerm(regex);
  return Code.find(searchQuery, { c: 0 }).lean().exec();
};

// const searchForMultipleTermsPreservingOrder = async (terms) => {
//   const longestTerm = terms.reduce((prev, curr) => {
//     if (curr.term.length > prev.term.length) return curr;
//     return prev;
//   });

//   const searchQuery = getSearchQueryForSingleTerm(longestTerm);

//   const regexTerm = getRegexForTermsPreservingOrder(terms);
//   searchQuery.t = { $regex: new RegExp(`${regexTerm}`, 'i') };

//   return Code.find(searchQuery, { c: 0 }).lean().exec();
// };

const searchForMultipleTermsWithoutPreservingOrder = async (regexes) => {
  const longestRegex = regexes.reduce((prev, curr) => {
    if (curr.length > prev.length) return curr;
    return prev;
  });

  const searchQuery = getSearchQueryForSingleTerm(longestRegex);
  delete searchQuery.t;

  searchQuery.$and = regexes.map(regexTerm => ({ t: { $regex: new RegExp(`${regexTerm}`, 'i') } }));

  return Code.find(searchQuery, { c: 0 }).lean().exec();
};

const searchForTerm = (terminology, term) => {
  if (!term.regexes) return []; // maybe throw error
  if (term.regexes.length > 1) {
    // if (term.preserveOrder) {
    //   return searchForMultipleTermsPreservingOrder(term.regexes);
    // }
    return searchForMultipleTermsWithoutPreservingOrder(term.regexes);
  }
  return searchForSingleTerm(term.regexes[0]);
};

const unique = arr => arr.filter((item, i, ar) => ar.indexOf(item) === i);

const getSynonymCodes = (terminology, codes) => {
  const codesForQuery = unique(codes.map((v) => {
    if (terminology === 'Readv2') {
      return v._id.substr(0, 5);
    }
    return v._id;
  }));
  let codesForSynonymQuery = [];
  if (terminology === 'Readv2') {
    codesForSynonymQuery = codesForQuery.map(v => ({ _id: new RegExp(`^${v}`) }));
  }
  const codesForNotQuery = codes.map(v => v._id);
  const query = {
    $and: [
      { $or: codesForSynonymQuery },
      // but doesn't match any of the original codes
      { _id: { $not: { $in: codesForNotQuery } } },
    ],
  };
  return Code.find(query, { c: 0 }).lean().exec();
};

const getDescendantCodes = (terminology, codes) => {
  const codesForQuery = unique(codes.map((v) => {
    if (terminology === 'Readv2') {
      return v._id.substr(0, 5);
    }
    return v._id;
  }));
  const codesForNotQuery = codes.map(v => v._id);
  const query = {
    $and: [
      { p: { $in: codesForQuery } },
      // but doesn't match any of the original codes
      { _id: { $not: { $in: codesForNotQuery } } },
    ],
  };
  return Code.find(query, { c: 0 }).lean().exec();
};

const getResults = async (terminology, searchterm) => {
  if (!cache[terminology]) cache[terminology] = {};
  if (!cache[terminology][searchterm.original]) {
    // Not found, so let's get it and then cache it
    const codes = await searchForTerm(terminology, searchterm);

    // in case nothing is matched we can return early
    if (codes.length === 0) {
      cache[terminology][searchterm.original] = [];
      return [];
    }
    // Get all descendants of the codes - but not those already matched.
    const descendantCodes = await getDescendantCodes(terminology, codes);
    const descendantCodeIds = {};
    descendantCodes.map((v) => {
      const item = v;
      // Keep track of the descendants by id
      descendantCodeIds[v._id] = true;
      // Mark the codes as being a descendant so we can easily tell it wasn't matched
      item.descendant = true;
      return item;
    });
    // Get all synonym codes - but not those already matched.
    const synonymCodes = await getSynonymCodes(terminology, codes);
    synonymCodes.map((v) => {
      const item = v;
      item.synonym = true;
      if (descendantCodeIds[v._id]) {
        // mark as descendant as well
        item.descendant = true;
        descendantCodeIds[v._id] = false;
      }
      return item;
    });
    // start merging the code lists
    // using the synonymCodes as the master - later we'll add the descendants
    const allCodes = synonymCodes.concat(codes);
    descendantCodes.forEach((v) => {
      if (descendantCodeIds[v._id]) {
        // not also a synonym so we can add it to the list
        allCodes.push(v);
      }
    });
    cache[terminology][searchterm.original] = allCodes;
    return allCodes;
  }
  // We've already done this so return from cache
  return cache[terminology][searchterm.original];
};

/**
 * @param {String} terminology The code terminology used
 * @param {Array} inclusions Array of terms to include
 * @param {Array} exclusions Array of terms to exclude
 * @returns {Object} the return
 */
// exports.search = (terminology, inclusions, exclusions) => {
//   inclusions.map(term => searchForTerm(terminology, term));
// };

/**
 * @description Converts an object with key value pairs into an array of values
 *
 * @param {object} obj The object to arrayify
 * @returns {array} The array of the object's values
 */
const toArray = obj => Object.keys(obj).map(v => obj[v]);

exports.searchMultiple = async (terminology, inclusions) => {
  const toReturn = {};
  const results = await Promise.all(inclusions.map(t => getResults(terminology, t)));
  results.forEach((result) => {
    result.forEach((v) => { // merge the results
      if (!toReturn[v._id] || toReturn[v._id].descendant || toReturn[v._id].synonym) {
        toReturn[v._id] = v;
      }
    });
  });
  const rtn = {
    codes: toArray(toReturn),
    timestamp: Date.now(),
    searchTerm: inclusions.map(term => term.original.toLowerCase()),
  };
  return rtn;
};

exports.search = (terminology, term) => getResults(terminology, term);

exports.searchForTerm = searchForTerm;