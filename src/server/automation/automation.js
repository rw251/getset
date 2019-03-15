const fs = require('fs');
const config = require('../config');
const mongoose = require('mongoose');
const Code = require('../models/Code')();
const CodesWithWord = require('../models/CodesWithWord');
const path = require('path');

const DEBUG = false;

let codesYetToBeMatched = [];
let fullCodeSet = [];
const codesAlreadyMatched = {};
const codesAlreadyExcluded = [];
let termsForExclusion = [];
const matchingTermsOfExcludedCodes = [];

/**
 * Escapes all characters apart from '*' in a regex string. From https://stackoverflow.com/a/6969486/596639
 * @param {String} str The string to escape for regex
 * @returns {String} The escaped string
 */
const escapeRegExp = str => str.replace(/[-[\]/{}()+?.\\^$|]/g, '\\$&');

const combinations = (arr, maxLen) => {
  const fn = (active, rest, a) => {
    if ((active.length !== 0 || rest.length !== 0) && active.length < maxLen + 1) {
      if (rest.length === 0) {
        a.push(active);
      } else {
        fn(active.concat(rest[0]), rest.slice(1), a);
        fn(active, rest.slice(1), a);
      }
      return a;
    }
  };
  return fn([], arr, []);
};

const connectToMongo = () => {
  console.log('Connecting to mongo');
  mongoose.set('debug', DEBUG);
  mongoose.Promise = global.Promise;
  mongoose.connect(config.mongoUrl);
  // add connection to other terminologies if they exist
  if (config.MONGO_URL_EMIS) mongoose.createConnection(config.MONGO_URL_EMIS);
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
  });
};

const loadCodeSet = () => {
  // Either use the filename from the cli arguments, or hardcode as codes.txt
  const filename = process.argv[2] || path.join(__dirname, 'input', 'codes.txt');
  console.log('Loading codeset');
  codesYetToBeMatched = fs.readFileSync(filename, 'utf8').split('\n').filter(v => v.length > 0);
  fullCodeSet = [].concat(codesYetToBeMatched);
  console.log(codesYetToBeMatched[0]);
  console.log('Codeset loaded');
};

let codeDescriptionsAreCached = false;
let wordCombinationRankingsAreNotCached = true;
let wordCombinationsAreNotCached = true;
let amendedRankingsAreNotDone = true;

/**
 * Returns an array of descriptions
 * @param {Array} codes Array of codes e.g. ['G30..00','G31.00']
 * @returns {Array} Array of descriptions [
 *  {_id:'G30..00', t:'first description'},
 *  {_id:'G31..00',t:'second description'}
 * ]
 */
const getCodeDescriptionsFromMongo = codes => Code
  .find({ _id: { $in: codes } }, { t: 1 })
  .lean().exec();

const getCodesFromDescriptions = descriptions => Code
  .find({}, { _id: 1, t: 1 })
  .lean().exec();

const getCodeDescriptionsFromMongoOrCache = async (codes) => {
  if (!codeDescriptionsAreCached) {
    const descriptions = await getCodeDescriptionsFromMongo(codes);
    descriptions.forEach((description) => {
      descriptions[description._id] = { t: description.t.toLowerCase() };
    });
    codeDescriptionsAreCached = true;
  }
};

/**
 * @key {String} The clinical code e.g. 'G30..00'
 * @value {Array} A list of word combinations taken from
 *  the codes description e.g. ["abscess", "severe", "severe abscess"]
 */
const wordCombinationsPerCode = new Map();

/**
 * @key {String} The word combination e.g. "severe abscess"
 * @value {int} The number of codes this combination matches
 */
const rankingOfWordCombinations = new Map();

const getCodeDefinitionsFromMongo = codes => CodesWithWord
  .find({ _id: { $in: codes } }, { t: 1 })
  .lean().exec();

const stopWords = ['other', 'nos', 'and', 'with', 'unspecified',
  'specified', 'oth', 'nec', 'the', 'reaction', 'poisoning', 'unsp',
  'from', 'disease', 'joint', 'not', 'due', 'dis', 'without', 'unspec',
  'area', 'pois', 'drug', 'syndrome', 'wound', 'bone', 'acute', 'body', 'unspecif'];
const neverWords = [];
const excludeToChunkMap = {};

const populateWordCombinationsFromDefinitions = (codeDefinitions) => {
  codeDefinitions.forEach((codeDefinition) => {
    const local = {};
    const bits = codeDefinition.t.toLowerCase().split('|');
    const v = bits[bits.length - 1];
    let matches = v.match(/\b(\w\w\w+)\b/g);
    if (!matches || matches.length === 0) return;
    matches = matches.filter(vv => stopWords.indexOf(vv) === -1);
    if (!matches || matches.length === 0) return;
    combinations(matches.filter((vv, i, a) => a.indexOf(vv) === i), 4).forEach((vv) => {
      local[vv.sort().join(' ')] = true;
    });
    wordCombinationsPerCode.set(codeDefinition._id, Object.keys(local));
  });
  wordCombinationsAreNotCached = false;
};

const populateWordCombinationsFromCodes = async (codes) => {
  if (wordCombinationsAreNotCached) {
    const codeDefinitions = await getCodeDefinitionsFromMongo(codes);
    populateWordCombinationsFromDefinitions(codeDefinitions);
  }
};

// const getMatchingCodesFromMongo = term => Code
//   .find({
//     c: term.substr(0, 6),
//     t: new RegExp(escapeRegExp(term), 'i'),
//   }, { _id: 1 })
//   .lean().exec();
const getMatchingCodesFromMongoWithTerms = (term) => {
  const bits = term.split(' ').sort((a, b) => b.length - a.length);
  const query = {};
  if (bits[0].length >= 6) {
    query.c = bits[0].substr(0, 6);
  } else {
    const reg = new RegExp(`^${bits[0]}`);
    query.c = { $regex: reg };
  }
  query.$and = bits.map(bt => ({ t: { $regex: new RegExp(`\\b${bt}\\b`, 'i') } }));
  return Code.find(query, { _id: 1, t: 1 }).lean().exec();
};

const getMatchingCodesFromMongoFromTerm = (terms) => {
  const orQuery = terms.map((term) => {
    const query = {};
    if (term.length >= 6) {
      query.c = term.substr(0, 6).toLowerCase();
    } else {
      const reg = new RegExp(`^${term.toLowerCase()}`);
      query.c = { $regex: reg };
    }
    query.t = { $regex: new RegExp(`(^|\\b|\\|)${escapeRegExp(term)}($|\\b|\\|)`, 'i') };
    return query;
  });

  return Code.find({ $or: orQuery }, { _id: 1 }).lean().exec();
};

const getMatchingCodesFromMongo = (term) => {
  const bits = term.split(' ').sort((a, b) => b.length - a.length);
  const query = {};
  if (bits[0].length >= 6) {
    query.c = bits[0].substr(0, 6);
  } else {
    const reg = new RegExp(`^${bits[0]}`);
    query.c = { $regex: reg };
  }
  query.$and = bits.map(bt => ({ t: { $regex: new RegExp(`\\b${bt}\\b`, 'i') } }));
  return Code.find(query, { _id: 1 }).lean().exec();
};

// // just whole words, don't care about order
// const getWordsFromCachedDescriptions = () => {
//   if (!codeDescriptionChunksAreCached) {
//     Object.keys(descriptions).forEach((d) => {
//       const description = descriptions[d];
//       const dBits = description.t.split('|');
//       description.c = [];
//       const wordCombinationsPerCode = {};
//       // dBits.forEach((bit) => {
//       const bit = dBits[dBits.length - 1];
//       if (bit === '') return;
//       const matches = bit.match(/\b(\w{5}\w+)\b/g);
//       if (!matches || matches.length === 0) return;
//       combinations(matches.filter((v, i, a) => a.indexOf(v) === i)).forEach((v) => {
//         wordCombinationsPerCode[v.join(' ')] = true;
//       });
//       // });

//       description.c = Object.keys(wordCombinationsPerCode);
//     });
//     codeDescriptionChunksAreCached = true;
//   }
// };

// doing it with chunks of length from to to
// const getChunksFromCachedDescriptions = (from, to) => {
//   if (!codeDescriptionChunksAreCached) {
//     Object.keys(descriptions).forEach((d) => {
//       const description = descriptions[d];
//       const dBits = description.t.split('|');
//       description.c = [];
//       const bits = [];
//       dBits.forEach((bit) => {
//         for (let n = from; n <= to; n += 1) {
//           if (bit.length < n) {
//             bits.push(bit);
//           } else {
//             let lastBit = bit.substr(0, n);
//             if (bit.length > n && alphabet.indexOf(bit[n]) < 0) { bits.push(lastBit); }
//             for (let i = n; i < bit.length; i += 1) {
//               lastBit = lastBit.slice(1) + bit[i];
//               if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
//             }
//             while (lastBit.length > 3) {
//               lastBit = lastBit.slice(1);
//               if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
//             }
//           }
//         }
//       });

//       description.c = bits;
//     });
//     codeDescriptionChunksAreCached = true;
//   }
// };

const incrementWordCombinationRanking = (wordCombination) => {
  if (!rankingOfWordCombinations.has(wordCombination)) {
    rankingOfWordCombinations.set(wordCombination, {
      matchesInCodeSet: 1,
      matchesNotInCodeSet: 0,
      allMatchingCodes: {},
    });
  } else {
    rankingOfWordCombinations.get(wordCombination).matchesInCodeSet += 1;
  }
};

const decrementWordCombinationRanking = (wordCombination) => {
  if (!rankingOfWordCombinations.has(wordCombination)) {
    rankingOfWordCombinations
      .set(wordCombination, rankingOfWordCombinations.get(wordCombination) - 1);
  }
};

const populateWordCombinationRankings = () => {
  if (wordCombinationRankingsAreNotCached) {
    wordCombinationsPerCode.forEach((wordCombinations) => {
      wordCombinations.forEach(incrementWordCombinationRanking);
    });

    wordCombinationRankingsAreNotCached = false;
  }
};

const cachedAmendedChunkRankings = new Map();

const removeFromNChunkRankings = (code) => {
  wordCombinationsPerCode.get(code).forEach((key) => {
    if (rankingOfWordCombinations.has(key)) {
      const rankingOfWordCombination = rankingOfWordCombinations.get(key);
      if (rankingOfWordCombination.matchesInCodeSet === 1) {
        Object.keys(rankingOfWordCombination.allMatchingCodes).forEach((co) => {
          const excludeIsNow = excludeToChunkMap[co].filter(v => v !== key);
          if (excludeIsNow.length > 0) {
            excludeToChunkMap[co] = excludeIsNow;
          } else {
            delete excludeToChunkMap[co];
          }
        });
        rankingOfWordCombinations.delete(key);
      } else {
        rankingOfWordCombination.matchesInCodeSet -= 1;
      }
    }
  });
};

const getCodesNeededToBeExcludedNChunksCount = bit => Code
  .count({
    c: bit.substr(0, 6),
    t: new RegExp(escapeRegExp(bit), 'i'),
    _id: { $nin: codesYetToBeMatched.concat(codesAlreadyExcluded) },
  }).lean().exec();

const getCodesNeededToBeExcludedNChunks = bit => Code
  .find({
    c: bit.substr(0, 6),
    t: new RegExp(escapeRegExp(bit), 'i'),
    _id: { $nin: codesYetToBeMatched.concat(codesAlreadyExcluded) },
  }, { _id: 1 }).lean().exec();

const getCodesNeededToBeExcludedNWordsCount = (bit) => {
  const bits = bit.split(' ').sort((a, b) => b.length - a.length);
  const query = {};
  if (bits[0].length >= 6) {
    query.c = bits[0].substr(0, 6);
  } else {
    const reg = new RegExp(`^${bits[0]}`);
    query.c = { $regex: reg };
  }
  query.$and = bits.map(bt => ({ t: { $regex: new RegExp(`\\b${bt}\\b`, 'i') } }));
  query._id = { $nin: codesYetToBeMatched.concat(codesAlreadyExcluded) };
  return Code.count(query).lean().exec();
};

const getMatchingCodesFromWordCombination = (bit) => {
  const words = bit.split(' ');
  const query = { words: { $all: words } };
  return CodesWithWord.find(query, { _id: 1 }).lean().exec();
};

const getAmendedChunkRanking = async (wordCombination) => {
  const rankingOfWordCombination = rankingOfWordCombinations.get(wordCombination);

  const matchingCodes = await getMatchingCodesFromWordCombination(wordCombination);
  matchingCodes.forEach((c) => {
    rankingOfWordCombination.allMatchingCodes[c._id] = true;
    if (!excludeToChunkMap[c._id]) {
      excludeToChunkMap[c._id] = [wordCombination];
    } else {
      excludeToChunkMap[c._id].push(wordCombination);
    }
  });

  rankingOfWordCombination.matchesNotInCodeSet = matchingCodes.length -
    rankingOfWordCombination.matchesInCodeSet;
};

// const ballistic = () => Object.keys(rankingOfWordCombinations)
//   .filter(v => v.indexOf(' ') < 0)
//   .map(async (v) => {
//     const prom = CodesWithWord.count({ words: v }).lean().exec();
//     const n = await prom;
//     return { v, n };
//   });
let amendedRankingOfWordCombinations = [];

const getWordCombinationsInChunks = (chunkSize = 1000) => {
  const chunkedArray = [];
  Array.from(rankingOfWordCombinations.keys()).forEach((v, i) => {
    if (i % chunkSize === 0) {
      chunkedArray.push([v]);
    } else {
      chunkedArray[chunkedArray.length - 1].push(v);
    }
  });
  return chunkedArray;
};

const populateAmendedWordCombinationRankings = async () => {
  if (amendedRankingsAreNotDone) {
    const wordCominationsChunk = getWordCombinationsInChunks();
    for (let i = 0; i < wordCominationsChunk.length; i += 1) {
      const promiseArray = wordCominationsChunk[i].map(getAmendedChunkRanking);
      if (DEBUG) console.log(`in${i}`);
      await Promise.all(promiseArray);
      if (DEBUG) console.log(`out${i}`);
    }

    // for (let i = 0, j = wordCombinations.length; i < j; i += chunkSize) {
    //   const promArray = wordCombinations
    //     .slice(i, i + chunkSize)
    //     .map(getAmendedChunkRanking);
    //   if (DEBUG) console.log(`in${i}`);
    //   await Promise.all(promArray);
    //   if (DEBUG) console.log(`out${i}`);
    // }
    amendedRankingsAreNotDone = false;
  } else {
    codesAlreadyExcluded.forEach((v) => {
      if (excludeToChunkMap[v]) {
        excludeToChunkMap[v].forEach((bit) => {
          const rankingOfWordCombination = rankingOfWordCombinations.get(bit);
          rankingOfWordCombination.matchesNotInCodeSet -= 1;
          delete rankingOfWordCombination.allMatchingCodes[v];
        });
        delete excludeToChunkMap[v];
      }
    });
  }
  // amendedRankings turns array of arrays:
  // [ ["word combination", {matchesInCodeSet:43, matchesNotInCodeSet: 10}] ]
  // into an array of objects
  // [ {wordCombination: "word combination", matchesInCodeSet:43, matchesNotInCodeSet: 10} ]
  const amendedRankings = Array.from(rankingOfWordCombinations.entries()).map(ranking => ({
    wordCombination: ranking[0],
    matchesInCodeSet: ranking[1].matchesInCodeSet,
    matchesNotInCodeSet: ranking[1].matchesNotInCodeSet,
  }));

  amendedRankings.sort((a, b) => {
    const left = (b.matchesInCodeSet - b.matchesNotInCodeSet) /
      (b.matchesNotInCodeSet + 1);
    const right = (a.matchesInCodeSet - a.matchesNotInCodeSet) /
      (a.matchesNotInCodeSet + 1);
    if (left === right) {
      return b.wordCombination.length - a.wordCombination.length;
    }
    return left - right;
  });
  amendedRankingOfWordCombinations = amendedRankings;
  // .reduce((prev, curr) => {
  //   if (prev[prev.length - 1].wordCombination.indexOf(curr.wordCombination) === -1) {
  //     prev.push(curr);
  //   }
  //   return prev;
  // }, [amendedRankings[0]]);
};

const terms = [];
const weAreTiming = false;

const getMinimalListOfTerms = () => {
  // if
  //    abscess cellulitis
  // and
  //    cellulitis
  // are terms then we clearly only need
  //    cellulitis
  const minimalTerms = [].concat(terms);
  return minimalTerms;
};

const includedWords = {};

const getBestWord = (excludedCodeDescriptions) => {
  const excludedWords = {};
  excludedCodeDescriptions.forEach((v) => {
    const words = v.replace(/[^a-zA-Z0-9\/]+/g, ' ').split(' ');
    words
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .forEach((vv) => {
        if (includedWords[vv]) return;
        if (excludedWords[vv]) excludedWords[vv] += 1;
        else excludedWords[vv] = 1;
      });
  });
  const sortedExcludeWords = Object.keys(excludedWords)
    .map(v => ({ word: v, count: excludedWords[v] })).sort((a, b) => b.count - a.count);
  return sortedExcludeWords[0];
};


const getSynonymCodes = (codes) => {
  const codesForQuery = codes.map(v => v.substr(0, 5));
  const codesForSynonymQuery = codesForQuery.map(v => ({ _id: new RegExp(`^${v}`) }));
  const query = {
    $and: [
      { $or: codesForSynonymQuery },
      // but doesn't match any of the original codes
      { _id: { $not: { $in: codes } } },
    ],
  };
  return Code.find(query, { c: 0 }).lean().exec();
};

const getDescendantCodes = (codes) => {
  const codesForQuery = codes.map(v => v.substr(0, 5));
  const query = {
    $and: [
      { p: { $in: codesForQuery } },
      // but doesn't match any of the original codes
      { _id: { $not: { $in: codes } } },
    ],
  };
  return Code.find(query, { c: 0 }).lean().exec();
};

const processExclusions = async () => {
  // take list of exclusion codes and find list of terms that
  // identifies them

  const includedCodeDescriptions = (await getCodeDescriptionsFromMongo(fullCodeSet))
    .map(v => v.t.toLowerCase());

  const synonymCodes = await getSynonymCodes(fullCodeSet);
  const descendantCodes = await getDescendantCodes(fullCodeSet);
  const synonymOrDescendantCodes = (synonymCodes.concat(descendantCodes)).map(v => v._id);

  const codesToExclude = codesAlreadyExcluded.concat(synonymOrDescendantCodes);
  // #1: Find any codes in our code set that are matched by the full text
  //     of the excluded term
  let excludedCodeDescriptions = (await getCodeDescriptionsFromMongo(codesToExclude))
    .map((description) => {
      const bits = description.t.toLowerCase().split('|');
      return bits[bits.length - 1];
    });

  excludedCodeDescriptions.forEach((description) => {
    includedCodeDescriptions.forEach((v) => {
      if (v.indexOf(description) > -1) {
        console.log(`THIS IS EXCLUDED: ${description}`);
        console.log(`THIS IS INCLUDED: ${v}`);
      }
    });
  });

  // find words that appear in excludedCodeDescriptions but not includedCodeDescriptions
  includedCodeDescriptions.forEach((v) => {
    const words = v.replace(/[^a-zA-Z0-9\/]+/g, ' ').split(' ');
    words.forEach((vv) => {
      includedWords[vv] = true;
    });
  });

  let bestWord = getBestWord(excludedCodeDescriptions);

  while (bestWord && bestWord.count > 2) {
    console.log(excludedCodeDescriptions.length);
    // remove all the code descriptions
    excludedCodeDescriptions = excludedCodeDescriptions.filter(v => v.replace(/[^a-zA-Z0-9\/]+/g, ' ').split(' ').indexOf(bestWord.word) < 0);

    // add the word instead
    excludedCodeDescriptions.push(bestWord.word.indexOf(' ') < 0 ? `"${bestWord.word}"` : bestWord.word);

    // do it again
    bestWord = getBestWord(excludedCodeDescriptions);
  }
  termsForExclusion = excludedCodeDescriptions;
};

let lastrun = 1000000;

const finishOff = async () => {
  const minimalTerms = getMinimalListOfTerms();
  await processExclusions();
  fs.writeFileSync(path.join(__dirname, 'output', 'terms.txt'), minimalTerms.join('\n'));
  fs.writeFileSync(path.join(__dirname, 'output', 'exclusions.txt'), termsForExclusion.join('\n'));
  process.exit();
};
// let inc = 0;
const main = async () => {
  // if (weAreTiming) console.time('Get code descriptions from mongo');
  // await getCodeDescriptionsFromMongoOrCache(codesYetToBeMatched);
  // if (weAreTiming) console.timeEnd('Get code descriptions from mongo');

  // if (weAreTiming) console.time('Get chunks');
  // getWordsFromCachedDescriptions();
  // if (weAreTiming) console.timeEnd('Get chunks');

  if (weAreTiming) console.time('Get word combinations');
  await populateWordCombinationsFromCodes(codesYetToBeMatched);
  if (weAreTiming) console.timeEnd('Get word combinations');

  if (weAreTiming) console.time('Get chunk rankings');
  populateWordCombinationRankings();
  // console.log(rankingOfWordCombinations.size);
  if (weAreTiming) console.timeEnd('Get chunk rankings');
  if (weAreTiming) console.time('Get amended chunk rankings');
  // const amendedRankingOfWordCombinations =
  await populateAmendedWordCombinationRankings();
  if (weAreTiming) console.timeEnd('Get amended chunk rankings');
  // console.log(amendedRankingOfWordCombinations[0], codesYetToBeMatched.length);

  // sometimes - TODO investigate why - the below might be an empty list
  if (amendedRankingOfWordCombinations.length === 0) {
    return finishOff();
  }

  const termToUse = amendedRankingOfWordCombinations[0].wordCombination;
  let isUsingFullTermDescription = false;
  let matchingTerms = [];

  if (amendedRankingOfWordCombinations[0].matchesInCodeSet -
    amendedRankingOfWordCombinations[0].matchesNotInCodeSet <= 1) {
    isUsingFullTermDescription = true;
    matchingTerms = (await getMatchingCodesFromMongoWithTerms(termToUse))
      .filter(code => codesYetToBeMatched.indexOf(code._id) >= 0)
      .map((code) => {
        const bits = code.t.split('|');
        return bits[bits.length - 1];
      });
    // sometimes matching terms are duplicated, but we don't want that:
    matchingTerms
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .forEach((term) => {
        terms.push(`"${term}"`);
      });
  } else {
    terms.push(termToUse);
  }
  if (weAreTiming) console.time('Get matching codes');
  const matchingCodes = isUsingFullTermDescription ?
    (await getMatchingCodesFromMongoFromTerm(matchingTerms)).map(code => code._id) :
    (await getMatchingCodesFromMongo(termToUse)).map(code => code._id);
  // console.log(codesYetToBeMatched.length);
  matchingCodes.forEach((code) => {
    if (codesAlreadyMatched[code]) return; // already matched
    if (codesAlreadyExcluded.indexOf(code) > -1) return; // already excluded
    if (codesYetToBeMatched.indexOf(code) < 0) {
      codesAlreadyExcluded.push(code);
      matchingTermsOfExcludedCodes.push(isUsingFullTermDescription ?
        matchingTerms.join('|') :
        termToUse);
    } else {
      codesAlreadyMatched[code] = true;
    }
    if (wordCombinationsPerCode.has(code)) {
      removeFromNChunkRankings(code);
      wordCombinationsPerCode.delete(code);
    }
  });
  codesYetToBeMatched = codesYetToBeMatched.filter(code => matchingCodes.indexOf(code) === -1);

  const thisRun = codesYetToBeMatched.length + terms.length + codesAlreadyExcluded.length;
  console.log(codesYetToBeMatched.length, thisRun);
  if (lastrun < thisRun) {
    // console.log('shouldnt heppen');
  }
  lastrun = thisRun;

  // console.log(codesYetToBeMatched.length);
  if (weAreTiming) console.timeEnd('Get matching codes');
  if (codesYetToBeMatched.length > 0) main();
  else {
    return finishOff();
  }
};

connectToMongo();
loadCodeSet();
main();
// const file = fs.readFileSync('server/exclusions', 'utf8');
// const lines = file.split('\n');
// lines.forEach((line) => {
//   const bits = line.split('\t');
//   if (bits[bits.length - 1].length > 0) {
//     codesAlreadyExcluded.push(bits[bits.length - 1]);
//   }
// });
// processExclusions();
