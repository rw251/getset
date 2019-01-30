// requires mongo running
const mongoose = require('mongoose');
const data = require('../db/test.db');
const Code = require('../../server/models/Code')('Readv2');
const db = require('../../server/controllers/db');
const { assert } = require('chai');
require('../../server/config');

describe('Model Comment Tests', () => {
  before(function (done) {
    this.timeout(10000); // as this takes a while
    mongoose.set('debug', false);
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGODB_TEST_URI, { useMongoClient: true }, (err) => {
      if (err) console.log(err);
      else {
        mongoose.connection.db.dropCollection('codes', () => {
          Code.collection.insertMany(data, (err1) => {
            if (err1) console.log(err1);
            else done();
          });
        });
      }
    });
  });

  after(() => {
    mongoose.disconnect();
  });

  it('plain', async () => {
    const codes = await db.searchForTerm('Readv2', { preserveOrder: false, regexes: ['myocardial infarction'] });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 4);
    assert.include(ids, 'HNG0009');
    assert.include(ids, 'G35X.00');
    assert.include(ids, 'G306.00');
    // assert.include(ids, 'EMISNQNO74');
    assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('short and plain', async () => {
    const codes = await db.searchForTerm('Readv2', { preserveOrder: false, regexes: ['MI'] });
    assert.equal(codes.length, 1022);
  }).timeout(10000);

  it('short and plain', async () => {
    const codes = await db.searchForTerm('EMIS', { preserveOrder: false, regexes: ['MI'] });
    assert.equal(codes.length, 203);
  }).timeout(10000);

  it('short and exact', async () => {
    const codes = await db.searchForTerm('Readv2', { preserveOrder: false, regexes: ['\\bMI\\b'] });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 3);
    assert.include(ids, 'HNG0009');
    assert.include(ids, '68W2200');
    assert.include(ids, 'G35X.00');
    // assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('multi phrase preserve order #1', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: false,
      regexes: ['\\bhip.*dislocat'],
    });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 4);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, 'EG00.00');
  }).timeout(10000);

  it('multi phrase preserve order #2', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: false,
      regexes: ['\\bdislocat.*hip\\b'],
    });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 4);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
  }).timeout(10000);

  it('multi phrase don\'t preserve order', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: false,
      regexes: ['\\bhip\\b', '\\bdislocat'],
    });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 5);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
    assert.include(ids, 'EG00.00');
  }).timeout(10000);

  it('works with hypens', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: false,
      regexes: ['\\bstevens\\-johnson\\b', '\\bsyndrome\\b'],
    });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 1);
    assert.include(ids, 'M151700');
  }).timeout(10000);

  it('gets descendants as well', async () => {
    const codes = await db.search('Readv2', {
      preserveOrder: false,
      regexes: ['\\bhip\\b', '\\bdislocat'],
    });
    const ids = codes.map(c => c._id.c);
    assert.equal(codes.length, 6);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'PE34.00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
    assert.include(ids, 'EG00.00');
  }).timeout(10000);
});

