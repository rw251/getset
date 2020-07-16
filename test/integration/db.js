// requires mongo running
const mongoose = require('mongoose');
const data = require('../db');
const modelGenerator = require('../../src/server/models/Code');
const db = require('../../src/server/controllers/db');
const { assert } = require('chai');
require('../../src/server/config');

const { terminologies } = require('../../src/server/services/terminology');

const Model = {};
terminologies.forEach(({ id, version }) => {
  if (!Model[id]) Model[id] = {};
  Model[id][version] = modelGenerator({ id, version });
});

describe('Model Comment Tests', () => {
  before(function (done) {
    this.timeout(10000); // as this takes a while
    mongoose.set('debug', false);
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGODB_TEST_URI, { useMongoClient: true }, (err) => {
      if (err) console.log(err);
      else {
        data
          .reduce(
            (lastPromise, terminology) =>
              lastPromise.then(() => {
                console.log(`drop codes-${terminology.name}`);
                return mongoose.connection.db
                  .dropCollection(`codes-${terminology.name}`)
                  .then(() => {
                    console.log('ee');
                    return Model[terminology.name].collection.insertMany(terminology.data);
                  })
                  .catch((errr) => {
                    if (errr.message !== 'ns not found') throw errr;
                    console.log('ff');
                    return Model[terminology.name].collection.insertMany(terminology.data);
                  });
              }),
            Promise.resolve()
          )
          .then(() => {
            console.log('d');
            return done();
          })
          .catch((errr) => {
            console.log('big', errr);
          });
      }
    });
  });

  after(() => {
    mongoose.disconnect();
  });

  it('plain Readv2', async () => {
    const result = await db.searchMultiple('Readv2', [
      {
        preserveOrder: false,
        original: 'myocardial infarction',
        regexes: ['myocardial infarction'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 3);
    // assert.include(ids, 'HNG0009');
    assert.include(ids, 'G35X.00');
    assert.include(ids, 'G306.00');
    // assert.include(ids, 'EMISNQNO74');
    assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('plain EMIS', async () => {
    const result = await db.searchMultiple('EMIS', [
      {
        preserveOrder: false,
        original: 'myocardial infarction',
        regexes: ['myocardial infarction'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 2);
    assert.include(ids, 'HNG0009');
    assert.include(ids, 'EMISNQNO74');
  }).timeout(10000);

  it('short and plain', async () => {
    const result = await db.searchMultiple('Readv2', [
      { preserveOrder: false, original: 'MI', regexes: ['MI'] },
    ]);
    assert.equal(result.codes.length, 1007);
  }).timeout(10000);

  it('short and plain', async () => {
    const result = await db.searchMultiple('EMIS', [
      { preserveOrder: false, original: 'MI', regexes: ['MI'] },
    ]);
    assert.equal(result.codes.length, 212);
  }).timeout(10000);

  it('short and exact', async () => {
    const result = await db.searchMultiple('Readv2', [
      { preserveOrder: false, original: '"MI"', regexes: ['\\bMI\\b'] },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 3);
    // assert.include(ids, 'HNG0009');
    assert.include(ids, '68W2200');
    assert.include(ids, 'G35X.00');
    // assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('multi phrase preserve order #1', async () => {
    const result = await db.searchMultiple('Readv2', [
      {
        preserveOrder: false,
        original: 'hip*dislocat*',
        regexes: ['\\bhip.*dislocat'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 4);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'PE34.00');
    assert.include(ids, 'S451300');
  }).timeout(10000);

  it('multi phrase preserve order #2', async () => {
    const result = await db.searchMultiple('Readv2', [
      {
        preserveOrder: false,
        original: 'dislocat*hip',
        regexes: ['\\bdislocat.*hip\\b'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 5);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'PE34.00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
  }).timeout(10000);

  it("multi phrase don't preserve order", async () => {
    const result = await db.searchMultiple('Readv2', [
      {
        preserveOrder: false,
        original: 'hip dislocat*',
        regexes: ['\\bhip\\b', '\\bdislocat'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 5);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'PE34.00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
  }).timeout(10000);

  it('works with hypens', async () => {
    const result = await db.searchMultiple('Readv2', [
      {
        preserveOrder: false,
        original: 'stevens-johnson syndrome',
        regexes: ['\\bstevens\\-johnson\\b', '\\bsyndrome\\b'],
      },
    ]);
    const ids = result.codes.map((c) => c._id);
    assert.equal(result.codes.length, 1);
    assert.include(ids, 'M151700');
  }).timeout(10000);
});
