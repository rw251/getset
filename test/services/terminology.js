/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/

// requires mongo running
const terminologySvc = require('../../server/services/terminology');
const assert = require('chai').assert;
require('../../server/config');

describe('Terminology parsing tests', () => {
  it('plain', async () => {
    const term = terminologySvc.getObject('myocardial infarction');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'myocardial infarction',
      regexes: ['\\bmyocardial\\b', '\\binfarction\\b'],
    });
  });

  it('short and plain', async () => {
    const term = terminologySvc.getObject('MI');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'MI',
      regexes: ['\\bMI\\b'],
    });
  });

  it('short and exact', async () => {
    const term = terminologySvc.getObject('*MI*');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: '*MI*',
      regexes: ['MI'],
    });
  });

  it('simple multi phrase preserve order', async () => {
    const term = terminologySvc.getObject('"hip dislocat*"');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: '"hip dislocat*"',
      regexes: ['\\bhip dislocat'],
    });
  });

  it('simple multi phrase don\'t preserve order', async () => {
    const term = terminologySvc.getObject('hip dislocation');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'hip dislocation',
      regexes: ['\\bhip\\b', '\\bdislocation\\b'],
    });
  });

  it('multi phrase preserve order #1', async () => {
    const term = terminologySvc.getObject('hip*dislocation');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'hip*dislocation',
      regexes: ['\\bhip.*dislocation\\b'],
    });
  });

  it('prevents naughty behaviour', async () => {
    const term = terminologySvc.getObject('[{}]^$');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: '[{}]^$',
      regexes: ['\\b\\[\\{\\}\\]\\^\\$\\b'],
    });
  });

  it('allows hyphens', async () => {
    const term = terminologySvc.getObject('stevens-johnson syndrome');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'stevens-johnson syndrome',
      regexes: ['\\bstevens\\-johnson\\b', '\\bsyndrome\\b'],
    });
  });

  it('full', async () => {
    const term = terminologySvc.getObject('total knee replac* cement');
    assert.deepEqual(term, {
      preserveOrder: false,
      original: 'total knee replac* cement',
      regexes: ['\\btotal\\b', '\\bknee\\b', '\\breplac', '\\bcement\\b'],
    });
  });
});
