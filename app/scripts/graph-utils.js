/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const utils = require('./utils');

const addDepth = (graph) => {
  let i;
  let u;
  let v;
  const Q = [];
  const G = graph;

  Object.keys(G).forEach((node) => {
    G[node].visited = 0;
    G[node].depth = 0;
  });

  Object.keys(G).forEach((node) => {
    if (G[node].visited || G[node].p.length > 0) return;

    Q.push(node);

    while (Q.length > 0) {
      u = Q.splice(0, 1)[0];
      const edges = G[u].c;
      for (i = 0; i < edges.length; i += 1) {
        v = edges[i];
        if (G[v].visited < G[v].p.length - 1) {
          G[v].visited += 1;
        } else if (G[v].visited === G[v].p.length - 1) {
          delete G[v].visited;
          G[v].depth = G[u].depth + 1;
          Q.push(v);
        }
      }
    }
  });

  return G;
};

const getCodeForTerminology = (code, terminology) => {
  if (terminology === 'Readv2') {
    return code.substr(0, 5);
  }
  return code;
};

const getConnectedSubtrees = (graph) => {
  let i;
  let u;
  let v;
  const rtn = [];
  const Q = [];
  const G = graph;


  Object.keys(G).forEach((node) => {
    G[node].unvisited = true;
    if (G[node].p.filter(vv => G[vv]).length === 0) {
      G[node].root = true;
    }
  });

  Object.keys(G).forEach((node) => {
    if (!G[node].unvisited || !G[node].root) return;

    const subGraph = {};
    Q.push(node);

    while (Q.length > 0) {
      u = Q.pop();
      delete G[u].unvisited;
      subGraph[u] = G[u];
      const edges = G[u].c.concat(G[u].p);
      for (i = 0; i < edges.length; i += 1) {
        v = edges[i];
        if (G[v].unvisited) {
          delete G[v].unvisited;
          Q.push(v);
        }
      }
    }
    rtn.push(addDepth(subGraph));
  });

  return rtn;
};

const getConnectedSubgraphs = (graph) => {
  let i;
  let u;
  let v;
  const rtn = [];
  const Q = [];
  const G = graph;


  Object.keys(G).forEach((node) => {
    G[node].unvisited = true;
  });

  Object.keys(G).forEach((node) => {
    if (!G[node].unvisited) return;

    const subGraph = {};
    Q.push(node);

    while (Q.length > 0) {
      u = Q.splice(0, 1)[0];
      delete G[u].unvisited;
      subGraph[u] = G[u];
      const edges = G[u].c.concat(G[u].p);
      for (i = 0; i < edges.length; i += 1) {
        v = edges[i];
        if (G[v].unvisited) {
          delete G[v].unvisited;
          Q.push(v);
        }
      }
    }
    rtn.push(addDepth(subGraph));
  });

  return rtn;
};

module.exports = {

  getHierarchies: (codes, currentTerminology, searchTerm) => {
    let isTree = true;
    const codeDic = {};
    codes.forEach((v) => {
      const parents = v.p;
      const codeForTerminology = getCodeForTerminology(v._id, currentTerminology);
      if (!codeDic[codeForTerminology]) {
        codeDic[codeForTerminology] = { p: parents, c: [], codes: [{ code: v._id, t: v.t }] };
      } else if (codeDic[codeForTerminology].codes.length === 0) {
        codeDic[codeForTerminology].codes.push({ code: v._id, t: v.t });
        codeDic[codeForTerminology].p = parents;
      } else {
        codeDic[codeForTerminology].codes.push({ code: v._id, t: v.t });
        codeDic[codeForTerminology].p = parents;
      }
      if (parents.length > 1) {
        isTree = false;
        console.log('Elements found with multiple parents i.e. this is a DAG not a tree');
      }
      parents.forEach((vv) => {
        if (codeDic[vv]) {
          codeDic[vv].c.push(codeForTerminology);
        } else {
          codeDic[vv] = { c: [codeForTerminology], p: [], codes: [] };
        }
      });
    });

    const connectedSubgraphs = isTree
                                ? getConnectedSubtrees(codeDic)
                                : getConnectedSubgraphs(codeDic);
    const matchedCodesConnectedSubgraphs = [];
    const unmatchedDescendentsConnectedSubgraphs = [];
    let numMatched = 0;
    let numUnmatched = 0;
    connectedSubgraphs.forEach((graph) => {
      const matchedGraphToReturn = [];
      const unmatchedGraphToReturn = [];

      Object.keys(graph).forEach((node) => {
        if (graph[node].codes.length === 0) {
          // graphToReturn.push({ code: node, description: '', depth: graph[node].depth });
        } else {
          graph[node].codes.forEach((code) => {
            const descriptionBits = utils.parseDescriptionMultipleTermsNEW(code.t, searchTerm);
            const item = {
              code: code.code,
              description: descriptionBits.text,
              depth: graph[node].depth,
            };
            if (descriptionBits.match) {
              matchedGraphToReturn.push(item);
              numMatched += 1;
            } else {
              unmatchedGraphToReturn.push(item);
              numUnmatched += 1;
            }
          });
        }
      });

      if (matchedGraphToReturn.length > 0) {
        matchedCodesConnectedSubgraphs.push(matchedGraphToReturn);
      }
      if (unmatchedGraphToReturn.length > 0) {
        unmatchedDescendentsConnectedSubgraphs.push(unmatchedGraphToReturn);
      }
    });
    matchedCodesConnectedSubgraphs.sort((b, a) => a.length - b.length);
    unmatchedDescendentsConnectedSubgraphs.sort((b, a) => a.length - b.length);
    return {
      matched: matchedCodesConnectedSubgraphs,
      unmatched: unmatchedDescendentsConnectedSubgraphs,
      numMatched,
      numUnmatched,
    };
  },

  getHierarchy: (codes, currentTerminology, searchTerm) => {
    let isTree = true;
    const codeDic = {};
    codes.forEach((v) => {
      const parents = v.p;
      const codeForTerminology = getCodeForTerminology(v._id, currentTerminology);
      if (!codeDic[codeForTerminology]) {
        codeDic[codeForTerminology] = { p: parents, c: [], codes: [{ code: v._id, t: v.t }] };
      } else if (codeDic[codeForTerminology].codes.length === 0) {
        codeDic[codeForTerminology].codes.push({ code: v._id, t: v.t });
        codeDic[codeForTerminology].p = parents;
      } else {
        codeDic[codeForTerminology].codes.push({ code: v._id, t: v.t });
        codeDic[codeForTerminology].p = parents;
      }
      if (parents.length > 1) {
        isTree = false;
        console.log('Elements found with multiple parents i.e. this is a DAG not a tree');
      }
      parents.forEach((vv) => {
        if (codeDic[vv]) {
          codeDic[vv].c.push(codeForTerminology);
        } else {
          codeDic[vv] = { c: [codeForTerminology], p: [], codes: [] };
        }
      });
    });

    let connectedSubgraphs = isTree
                                ? getConnectedSubtrees(codeDic)
                                : getConnectedSubgraphs(codeDic);
    connectedSubgraphs = connectedSubgraphs.map((graph) => {
      const graphToReturn = [];

      Object.keys(graph).forEach((node) => {
        if (graph[node].codes.length === 0) {
          graphToReturn.push({ code: node, description: '', depth: graph[node].depth });
        } else {
          graph[node].codes.forEach((code) => {
            graphToReturn.push({
              code: code.code,
              description: utils.parseDescriptionMultipleTerms(code.t, searchTerm),
              depth: graph[node].depth,
            });
          });
        }
      });

      return graphToReturn;
    }).sort((b, a) => a.length - b.length);
    return connectedSubgraphs;
  },
};
