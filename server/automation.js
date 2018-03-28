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

const getCodeDescriptionsFromMongo = codes => Code
  .find({ _id: { $in: codes } }, { t: 1 })
  .lean().exec();

const getMatchingCodesFromMongo = term => Code
  .find({
    c: term.substr(0, 6),
    t: new RegExp(escapeRegExp(term), 'i'),
  }, { _id: 1 })
  .lean().exec();

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
// For each n character description chunk find the chunks that match the most codes
const getNChunkRankings = (chunks) => {
  const allChunkRankings = {};
  chunks.forEach((chunk) => {
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

const getCodesNeededToBeExcludedNChunks = bit => Code
  .count({
    c: bit.substr(0, 6),
    t: new RegExp(escapeRegExp(bit), 'i'),
    _id: { $nin: codesYetToBeMatched.concat(codesAlreadyExcluded) },
  }).lean().exec();

const getAmendedChunkRanking = async (ranking) => {
  const numberNeededToExclude = await getCodesNeededToBeExcludedNChunks(ranking.bit);
  ranking.x = numberNeededToExclude;
  return ranking;
};

const getAmendedChunkRankings = async (rankings) => {
  const promArray = rankings.map(ranking => getAmendedChunkRanking(ranking));
  const amendedRankings = await Promise.all(promArray);
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
const doItAll = async () => {
  console.time('Get code descriptions from mongo');
  const descriptions = await getCodeDescriptionsFromMongo(codesYetToBeMatched);
  console.timeEnd('Get code descriptions from mongo');

  console.time('Get chunks');
  const chunks = getChunksFromDescriptions(descriptions, 6, 100);
  console.timeEnd('Get chunks');

  console.time('Get chunk rankings');
  const rankings = getNChunkRankings(chunks);
  console.timeEnd('Get chunk rankings');

  console.time('Get amended chunk rankings');
  const amendedRankings = await getAmendedChunkRankings(rankings);
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
  });
  codesYetToBeMatched = codesYetToBeMatched.filter(code => matchingCodes.indexOf(code) === -1);
  console.log(codesYetToBeMatched.length);
  console.timeEnd('Get matching codes');
  if (codesYetToBeMatched.length > 0) doItAll();
  else process.exit();
};

connectToMongo();
const originalCodeSet = loadCodeSet(process.argv[2] || path.join(__dirname, 'codes.txt'));
codesYetToBeMatched = originalCodeSet;
doItAll();

