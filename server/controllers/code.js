/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const Code = require('../models/Code');

// This will need optimising at some point
// but while small scale it is a good optimisation
const cache = {};

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


const mergeResults = (cur, result) => {
  result.forEach((r) => {
    cur[r._id] = r;
  });
};

const toArray = obj => Object.keys(obj).map(v => obj[v]);

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

