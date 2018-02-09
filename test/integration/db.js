/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

// requires mongo running
const mongoose = require('mongoose');
const data = require('../db/test.db');
const Code = require('../../server/models/Code');
const db = require('../../server/controllers/db');
const assert = require('chai').assert;
require('../../server/config');

describe('Model Comment Tests', () => {
  before(function (done) {
    this.timeout(10000); // as this takes a while
    mongoose.set('debug', false);
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGODB_TEST_URI, null, (err) => {
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
    const codes = await db.searchForTerm('Readv2', { terms: [{ term: 'myocardial infarction', wildcardAtStart: true, wildcardAtEnd: true }] });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 5);
    assert.include(ids, 'HNG0009');
    assert.include(ids, 'G35X.00');
    assert.include(ids, 'G306.00');
    assert.include(ids, 'EMISNQNO74');
    assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('short and plain', async () => {
    const codes = await db.searchForTerm('Readv2', { terms: [{ term: 'MI', wildcardAtStart: true, wildcardAtEnd: true }] });
    assert.equal(codes.length, 1225);
  }).timeout(10000);

  it('short and exact', async () => {
    const codes = await db.searchForTerm('Readv2', { terms: [{ term: 'MI', wildcardAtStart: false, wildcardAtEnd: false }] });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 3);
    assert.include(ids, 'HNG0009');
    assert.include(ids, '68W2200');
    assert.include(ids, 'G35X.00');
    // assert.include(ids, 'G363.00');
  }).timeout(10000);

  it('multi phrase preserve order #1', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: true,
      terms: [
        { term: 'hip', wildcardAtStart: false, wildcardAtEnd: false },
        { term: 'dislocat', wildcardAtStart: false, wildcardAtEnd: true },
      ],
    });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 4);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, 'EGTONHI4');
  }).timeout(10000);

  it('multi phrase preserve order #2', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: true,
      terms: [
        { term: 'dislocat', wildcardAtStart: false, wildcardAtEnd: true },
        { term: 'hip', wildcardAtStart: false, wildcardAtEnd: false },
      ],
    });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 4);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
  }).timeout(10000);

  it('multi phrase don\'t preserve order', async () => {
    const codes = await db.searchForTerm('Readv2', {
      preserveOrder: false,
      terms: [
          { term: 'hip', wildcardAtStart: false, wildcardAtEnd: false },
          { term: 'dislocat', wildcardAtStart: false, wildcardAtEnd: true },
      ],
    });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 5);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
    assert.include(ids, 'EGTONHI4');
  }).timeout(10000);

  it('gets descendants as well', async () => {
    const codes = await db.search('Readv2', {
      preserveOrder: false,
      terms: [
        { term: 'hip', wildcardAtStart: false, wildcardAtEnd: false },
        { term: 'dislocat', wildcardAtStart: false, wildcardAtEnd: true },
      ],
    });
    const ids = codes.map(c => c._id);
    assert.equal(codes.length, 6);
    assert.include(ids, 'S451200');
    assert.include(ids, 'PE3..00');
    assert.include(ids, 'PE34.00');
    assert.include(ids, 'S451300');
    assert.include(ids, '14H5.00');
    assert.include(ids, 'EGTONHI4');
  }).timeout(10000);
});

