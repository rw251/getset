const fs = require('fs');
const config = require('./config');
const mongoose = require('mongoose');
const Code = require('./models/Code')();
const path = require('path');

const DEBUG = false;

let codesYetToBeMatched = [];
const codesAlreadyExcluded = [];

/**
 * Escapes all characters apart from '*' in a regex string. From https://stackoverflow.com/a/6969486/596639
 * @param {String} str The string to escape for regex
 * @returns {String} The escaped string
 */
const escapeRegExp = str => str.replace(/[-[\]/{}()+?.\\^$|]/g, '\\$&');

const connectToMongo = () => {
  console.log('Connecting to mongo');
  mongoose.set('debug', DEBUG);
  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGODB_URI);
  // add connection to other terminologies if they exist
  if (config.MONGO_URL_EMIS) mongoose.createConnection(config.MONGO_URL_EMIS);
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
  });
};

const loadCodeSet = (filename) => {
  console.log('Loading codeset');
  const codes = fs.readFileSync(filename, 'utf8').split('\n');
  console.log(codes[0]);
  console.log('Codeset loaded');
  return codes;
};

let codeDescriptionsAreCached = false;
let codeDescriptionChunksAreCached = false;
const cachedCodeDescriptions = {};

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

const getCodeDescriptionsFromMongoOrCache = async (codes) => {
  if (!codeDescriptionsAreCached) {
    const descriptions = await getCodeDescriptionsFromMongo(codes);
    descriptions.forEach((description) => {
      cachedCodeDescriptions[description._id] = { t: description.t.toLowerCase() };
    });
    codeDescriptionsAreCached = true;
  }
};

const getMatchingCodesFromMongo = term => Code
  .find({
    c: term.substr(0, 6),
    t: new RegExp(escapeRegExp(term), 'i'),
  }, { _id: 1 })
  .lean().exec();

const getChunksFromCachedDescriptions = (from, to) => {
  if (!codeDescriptionChunksAreCached) {
    Object.keys(cachedCodeDescriptions).forEach((d) => {
      const description = cachedCodeDescriptions[d];
      const dBits = description.t.split('|');
      description.c = [];
      const bits = [];
      dBits.forEach((bit) => {
        for (let n = from; n <= to; n += 1) {
          if (bit.length < n) {
            bits.push(bit);
          } else {
            let lastBit = bit.substr(0, n);
            bits.push(lastBit);
            for (let i = n; i < bit.length; i += 1) {
              lastBit = lastBit.slice(1) + bit[i];
              if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
            }
            while (lastBit.length > 3) {
              lastBit = lastBit.slice(1);
              if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
            }
          }
        }
      });

      description.c = bits;
    });
    codeDescriptionChunksAreCached = true;
  }
};

const getChunksFromDescriptions = (descriptions, from, to) => descriptions.map((description) => {
  description.t = description.t.toLowerCase();

  const dBits = description.t.split('|');
  description.c = [];
  const bits = [];
  dBits.forEach((bit) => {
    for (let n = from; n <= to; n += 1) {
      if (bit.length < n) {
        bits.push(bit);
      } else {
        let lastBit = bit.substr(0, n);
        bits.push(lastBit);
        for (let i = n; i < bit.length; i += 1) {
          lastBit = lastBit.slice(1) + bit[i];
          if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
        }
        while (lastBit.length > 3) {
          lastBit = lastBit.slice(1);
          if (lastBit[0] !== ' ' && lastBit[lastBit.length - 1] !== ' ') bits.push(lastBit);
        }
      }
    }
  });

  description.c = bits;
  return description;
});

const getNChunkRankings = () => {
  const allChunkRankings = {};
  Object.keys(cachedCodeDescriptions).forEach((d) => {
    const chunk = cachedCodeDescriptions[d];
    const thisChunk = {}; // so we don't double count chunks within a single code
    chunk.c.forEach((bit) => {
      if (!thisChunk[bit]) {
        if (!allChunkRankings[bit]) allChunkRankings[bit] = 1;
        else allChunkRankings[bit] += 1;
        thisChunk[bit] = true;
      }
    });
  });

  // return the top 1000 sorted
  return Object.keys(allChunkRankings)
    .map(bit => ({ bit, n: allChunkRankings[bit] }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 2000);
};

let areChunkRankingsCached = false;
const cachedChunkRankings = {};
const getNChunkRankingsOrCache = (force) => {
  if (force || !areChunkRankingsCached) {
    const rankings = getNChunkRankings();
    rankings.forEach((ranking) => {
      cachedChunkRankings[ranking.bit] = ranking.n;
    });
    areChunkRankingsCached = true;
  }
};
const cachedAmendedChunkRanking = {};

const removeFromNChunkRankings = (code) => {
  const chunk = cachedCodeDescriptions[code];
  const thisChunk = {}; // so we don't double count chunks within a single code
  chunk.c.forEach((bit) => {
    thisChunk[bit] = true;
  });
  Object.keys(thisChunk).forEach((key) => {
    if (cachedChunkRankings[key]) { cachedChunkRankings[key] -= 1; }
    if (cachedAmendedChunkRanking[key]) { cachedAmendedChunkRanking[key].n -= 1; }
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

// const getAmendedChunkRanking = async (ranking) => {
//   const numberNeededToExclude = await getCodesNeededToBeExcludedNChunksCount(ranking.bit);
//   ranking.x = numberNeededToExclude;
//   return ranking;
// };


const getAmendedChunkRanking = async (bit, force) => {
  if (force || !cachedAmendedChunkRanking[bit]) {
    cachedAmendedChunkRanking[bit] = { n: cachedChunkRankings[bit] };
    const codesNeededToExclude = await getCodesNeededToBeExcludedNChunks(bit);
    cachedAmendedChunkRanking[bit].codes = {};
    codesNeededToExclude.forEach((c) => {
      cachedAmendedChunkRanking[bit].codes[c._id] = true;
    });
    cachedAmendedChunkRanking[bit].x = codesNeededToExclude.length;
  } else {
    codesAlreadyExcluded.forEach((v) => {
      if (cachedAmendedChunkRanking[bit].codes[v]) {
        delete cachedAmendedChunkRanking[bit].codes[v];
      }
    });
  }
};

const getAmendedChunkRankings = async (force) => {
  const promArray = Object.keys(cachedChunkRankings).map(bit => getAmendedChunkRanking(bit, force));
  await Promise.all(promArray);
  const amendedRankings = Object.keys(cachedAmendedChunkRanking).map(v =>
    ({ bit: v, n: cachedAmendedChunkRanking[v].n, x: cachedAmendedChunkRanking[v].x }));
  amendedRankings.sort((a, b) => {
    const left = (b.n - b.x) / (b.x + 1);
    const right = (a.n - a.x) / (a.x + 1);
    if (left === right) {
      return b.bit.length - a.bit.length;
    }
    return left - right;
  });
  return amendedRankings.reduce((prev, curr) => {
    if (prev[prev.length - 1].bit.indexOf(curr.bit) === -1) {
      prev.push(curr);
    }
    return prev;
  }, [amendedRankings[0]]);
};

const terms = [];
let inc = 0;
const doItAll = async () => {
  console.time('Get code descriptions from mongo');
  await getCodeDescriptionsFromMongoOrCache(codesYetToBeMatched);
  console.timeEnd('Get code descriptions from mongo');

  console.time('Get chunks');
  getChunksFromCachedDescriptions(6, 100);
  console.timeEnd('Get chunks');

  console.time('Get chunk rankings');
  getNChunkRankingsOrCache(inc % 25 === 0);
  console.timeEnd('Get chunk rankings');
  fs.writeFileSync(`new_rankings${inc}`, JSON.stringify(cachedChunkRankings, null, 2));
  console.time('Get amended chunk rankings');
  const amendedRankings = await getAmendedChunkRankings(inc % 25 === 0);
  fs.writeFileSync(`new_amendedRankings${inc}`, JSON.stringify(amendedRankings, null, 2));
  console.timeEnd('Get amended chunk rankings');
  console.log(amendedRankings[0]);

  const termToUse = amendedRankings[0].bit;
  terms.push(termToUse);
  console.time('Get matching codes');
  const matchingCodes = (await getMatchingCodesFromMongo(termToUse)).map(code => code._id);
  console.log(codesYetToBeMatched.length);
  matchingCodes.forEach((code) => {
    if (codesYetToBeMatched.indexOf(code) < 0) {
      codesAlreadyExcluded.push(code);
    }
    if (cachedCodeDescriptions[code]) {
      removeFromNChunkRankings(code);
      delete cachedCodeDescriptions[code];
      delete cachedAmendedChunkRanking[code];
    }
  });
  codesYetToBeMatched = codesYetToBeMatched.filter(code => matchingCodes.indexOf(code) === -1);
  console.log(codesYetToBeMatched.length);
  console.timeEnd('Get matching codes');
  inc += 1;
  if (codesYetToBeMatched.length > 0) doItAll();
  else process.exit();
};

connectToMongo();
const originalCodeSet = loadCodeSet(process.argv[2] || path.join(__dirname, 'codes.txt'));
codesYetToBeMatched = originalCodeSet;
doItAll();

