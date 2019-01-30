const modelGenerator = require('../models/Code');
const { terminologies } = require('../services/terminology');

const Model = terminologies.reduce((prev, terminology) => {
  prev[terminology] = modelGenerator(terminology);
  return prev;
}, {});

// This will need optimising at some point
// but while small scale it is a good optimisation
const cache = {};

const doSearch = (terminology, term, regexes) => {
  // 1. Get rid of "s as they have a special meaning in the search
  // 2. Split on ' '
  // 3. Don't want terms with a wildcard as that's not how the mongo db
  //    is setup. Need whole words. Instead these get picked up by the
  //    regexes
  // 4. Trim off any non alphanumeric characters from start and finish
  // 5. Make lowercase as that is what is in the db
  const searchQuery = {
    w: {
      $all: term.replace(/"/g, '')
        .split(' ')
        .filter(x => x.indexOf('*') < 0)
        .map(x => x.replace(/(^[^\w\d]*|[^\w\d]*$)/g, '').toLowerCase()),
    },
    $and: regexes.map(regexTerm => ({ t: { $regex: new RegExp(`${regexTerm}`, 'i') } })),
  };
  if (searchQuery.w.$all.length === 0) delete searchQuery.w;
  return Model[terminology].find(searchQuery, { c: 0 }).lean({ virtuals: true }).exec();
};

const searchForTerm = (terminology, term) => {
  if (!term.regexes) return []; // maybe throw error
  return doSearch(terminology, term.original, term.regexes);
};

const unique = arr => arr.filter((item, i, ar) => ar.indexOf(item) === i);

const getSynonymCodes = (terminology, codes) => {
  console.log('USAGE: controllers/db.js getSynonymCodes');
  const codesForQuery = unique(codes.map((v) => {
    if (terminology === 'Readv2') {
      return v._id.substr(0, 5);
    }
    return v._id;
  }));
  let regexForSynonymQuery = new RegExp();
  if (terminology === 'Readv2') {
    regexForSynonymQuery = new RegExp(codesForQuery.map(v => `(^${v})`).join('|'));
  }
  const codesForNotQuery = codes.map(v => v._id);
  const query = {
    $and: [
      { _id: regexForSynonymQuery },
      // but doesn't match any of the original codes
      { _id: { $not: { $in: codesForNotQuery } } },
    ],
  };
  return Model[terminology].find(query, { c: 0 }).lean({ virtuals: true }).exec();
};

const getDescendantCodes = (terminology, codes) => {
  console.log('USAGE: controllers/db.js getDescendantCodes');
  const codesForQuery = unique(codes.map((v) => {
    if (terminology === 'Readv2') {
      return v._id.substr(0, 5);
    }
    return v._id;
  }));
  const codesForNotQuery = codes.map(v => v._id);
  const query = {
    p: { $in: codesForQuery },
    // but doesn't match any of the original codes
    _id: { $not: { $in: codesForNotQuery } },
  };
  return Model[terminology].find(query, { c: 0 }).lean({ virtuals: true }).exec();
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
    let synonymCodes = [];
    if (terminology === 'Readv2') synonymCodes = await getSynonymCodes(terminology, codes);
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

exports.search = (terminology, term) => {
  console.log('USAGE: controllers/db.js search');
  getResults(terminology, term);
};

exports.searchForTerm = searchForTerm;
