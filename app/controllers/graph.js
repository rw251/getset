const utils = require('../scripts/utils');

const graph = {
  counts: {},

  getShallowChildren(node) {
    return graph.edges[node]
      .sort((a, b) => graph.edges[b].length - graph.edges[a].length)
      .map(childNode => ({
        id: graph.nodes[childNode].id,
        label: graph.nodes[childNode].label,
        included: graph.nodes[childNode].included,
        excluded: graph.nodes[childNode].excluded,
        hasChildren: graph.edges[childNode].length > 0,
      }));
  },

  getDescendantCount(vertex) {
    vertex.discovered = true;
    graph.edges[vertex.id].forEach((destination) => {
      if (!graph.nodes[destination].discovered) {
        graph.getDescendantCount(graph.nodes[destination]);
      }
      graph.counts.included[vertex.id] +=
        graph.counts.included[destination] +
        (graph.nodes[destination].included ? 1 : 0);
      graph.counts.excluded[vertex.id] +=
        graph.counts.excluded[destination] +
        (graph.nodes[destination].excluded ? 1 : 0);
      graph.counts.unknown[vertex.id] +=
        graph.counts.unknown[destination] +
        (!graph.nodes[destination].included && !graph.nodes[destination].excluded
          ? 1
          : 0);
    });
    vertex.descendants = {
      included: graph.counts.included[vertex.id],
      excluded: graph.counts.excluded[vertex.id],
      unknown: graph.counts.unknown[vertex.id],
    };
  },

  initializeGraph(codes, terminology) {
    const codeLookup = {};
    codes.forEach((code, i) => {
      code.id = code._id;
      code.included = !code.descendant && !code.synonym;
      codeLookup[utils.getCodeForTerminology(code.id, terminology)] = i;
    });
    graph.counts.included = codes.map(() => 0);
    graph.counts.excluded = codes.map(() => 0);
    graph.counts.unknown = codes.map(() => 0);
    graph.nodes = codes.map((x, i) => ({
      id: i,
      terms: x.t.split('|'),
      label: x.t.split('|').sort((a, b) => b.length - a.length)[0],
      // descendants: Math.floor(Math.random() * 100),
      included: x.included,
      excluded: x.excluded,
      code: x.id,
    }));
    graph.roots = codes
      .map((x, i) => ({
        nodeId: i,
        numParents: x.p.filter(y => codeLookup[y] || codeLookup[y] === 0).length,
      }))
      .filter(x => x.numParents === 0)
      .map(x => x.nodeId);
    graph.edges = codes.map(() => []);

    codes.forEach((code, i) => {
      code.p.forEach((parent) => {
        if (codeLookup[parent] || codeLookup[parent] === 0) {
          graph.edges[codeLookup[parent]].push(i);
        }
      });
    });
    console.time('getDescendantCounts');
    graph.roots.forEach(root => graph.getDescendantCount(graph.nodes[root]));
    console.timeEnd('getDescendantCounts');
  },
};

module.exports = graph;
