/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const Code = require('../models/Code');

const BIT_LENGTH = 6;

// This will need optimising at some point
// but while small scale it is a good optimisation
const cache = {};

/**
 * Escapes all characters in a regex string. From https://stackoverflow.com/a/6969486/596639
 * @param {String} str The string to escape for regex
 * @returns {String} The escaped string
 */
const escapeRegExp = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

/**
 * Takes into account the wildcards at start or end to determine whether to
 * search for word breaks or not
 * @param {Object} term The term to search for. Term.term is the text
 * @returns {String} the regexed string.
 */
const getRegexForTerm = (term) => {
  let regexTerm = term.term;
  if (!term.wildcardAtStart) regexTerm = `\\b${regexTerm}`;
  if (!term.wildcardAtEnd) regexTerm = `${regexTerm}\\b`;
  return regexTerm;
};

/**
 *  For a list of terms preserving order returns the regex
 * @param {Array} terms List of terms to get regex for.
 * @returns {String} the regexed string.
 */
const getRegexForTermsPreservingOrder = terms => terms.map(getRegexForTerm).join('.*');

const getSearchQueryForSingleTerm = (term) => {
  const searchTerm = term.term;
  const bit = searchTerm.substr(0, BIT_LENGTH).toLowerCase();
  let match = { c: bit };
  if (bit.length < BIT_LENGTH) {
    const reg = new RegExp(`^${escapeRegExp(bit)}`);
    match = { c: { $regex: reg } };
  }
  const regexTerm = getRegexForTerm(term);
  match.t = { $regex: new RegExp(`${regexTerm}`, 'i') };
  return match;
};

const searchForSingleTerm = (term) => {
  const searchQuery = getSearchQueryForSingleTerm(term);
  return Code.find(searchQuery, { c: 0 }).lean().exec();
};

const searchForMultipleTermsPreservingOrder = async (terms) => {
  const longestTerm = terms.reduce((prev, curr) => {
    if (curr.term.length > prev.term.length) return curr;
    return prev;
  });

  const searchQuery = getSearchQueryForSingleTerm(longestTerm);

  const regexTerm = getRegexForTermsPreservingOrder(terms);
  searchQuery.t = { $regex: new RegExp(`${regexTerm}`, 'i') };

  return Code.find(searchQuery, { c: 0 }).lean().exec();
};

const searchForMultipleTermsWithoutPreservingOrder = async (terms) => {
  const longestTerm = terms.reduce((prev, curr) => {
    if (curr.term.length > prev.term.length) return curr;
    return prev;
  });

  const searchQuery = getSearchQueryForSingleTerm(longestTerm);
  delete searchQuery.t;

  searchQuery.$and = terms.map((t) => {
    const regexTerm = getRegexForTerm(t);
    return { t: { $regex: new RegExp(`${regexTerm}`, 'i') } };
  });

  return Code.find(searchQuery, { c: 0 }).lean().exec();
};

const searchForTerm = (terminology, term) => {
  if (!term.terms) return []; // maybe throw error
  if (term.terms.length > 1) {
    if (term.preserveOrder) {
      return searchForMultipleTermsPreservingOrder(term.terms);
    }
    return searchForMultipleTermsWithoutPreservingOrder(term.terms);
  }
  return searchForSingleTerm(term.terms[0]);
};

const getDescendantCodes = (terminology, codes) => {
  const codesForQuery = codes.map((v) => {
    if (terminology === 'Readv2') {
      return v._id.substr(0, 5);
    }
    return v._id;
  });
  const codesForNotQuery = codes.map(v => v._id);
  const query = { $and: [
    // matches all descendants of the codes already found
    { p: { $in: codesForQuery } },
    // but doesn't match any of the original codes
    { _id: { $not: { $in: codesForNotQuery } } },
  ] };
  return Code.find(query, { c: 0 }).lean().exec();
};

const getResults = async (terminology, searchterm) => {
  if (!cache[terminology]) cache[terminology] = {};
  if (!cache[terminology][searchterm.term]) {
    cache[terminology][searchterm.term] = { };
  }
  let wildcardId = searchterm.wildcardAtStart ? '1' : '0';
  wildcardId += searchterm.wildcardAtEnd ? '1' : '0';
  if (!cache[terminology][searchterm.term][wildcardId]) {
    // Not found, so let's get it and then cache it
    const codes = await searchForTerm(terminology, searchterm);
    const descendantCodes = await getDescendantCodes(terminology, codes);
    const allCodes = descendantCodes.concat(codes);
    cache[terminology][searchterm.term][wildcardId] = allCodes;
    return allCodes;
  }
  // We've already done this so return from cache
  return cache[terminology][searchterm.term][wildcardId];
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

exports.searchMultiple = (terminology, inclusions) => {
  const results = inclusions.map(t => getResults(terminology, t));
  // TODO need to merge the results at this point.
};

exports.search = (terminology, term) => getResults(terminology, term);

exports.searchForTerm = searchForTerm;
