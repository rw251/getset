const graph = require('../../../app/controllers/graph.js');
const { assert } = require('chai');

describe('Descdendant counts', () => {
  it('works for trees', async () => {
    graph.initializeGraph([
      { id: '1', t: 'one', p: ['0'] },
      { id: '2', t: 'one', p: ['1'] },
      { id: '3', t: 'one', p: ['1'] },
      { id: '4', t: 'one', p: ['1'] },
      { id: '5', t: 'one', p: ['4'] },
      { id: '6', t: 'one', p: ['4'] },
      { id: '7', t: 'one', p: ['6'] },
    ], 'snomed');
  });
  it('works for DAGs', async () => {
    graph.initializeGraph([
      { id: '1', t: 'one', p: ['0'] },
      { id: '2', t: 'one', p: ['1'] },
      { id: '3', t: 'one', p: ['1', '2'] },
      { id: '4', t: 'one', p: ['1', '2', '3'] },
      { id: '5', t: 'one', p: ['4'] },
      { id: '6', t: 'one', p: ['4'] },
      { id: '7', t: 'one', p: ['6'] },
    ], 'snomed');
  });
});
