import {
  getCodeForTerminology,
  parseDescriptionMultipleTermsNEW,
  parseDescriptionMultipleTerms,
} from './utils';

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
      [u] = Q.splice(0, 1);
      const edges = G[u].c;
      for (i = 0; i < edges.length; i += 1) {
        v = edges[i];
        if (G[v]) {
          if (G[v].visited < G[v].p.length - 1) {
            G[v].visited += 1;
          } else if (G[v].visited === G[v].p.length - 1) {
            delete G[v].visited;
            G[v].depth = G[u].depth + 1;
            Q.push(v);
          }
        }
      }
    }
  });

  return G;
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
      [u] = Q.splice(0, 1);
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

const getHierarchiesWithExistingCodeList = (
  codes,
  currentTerminology,
  searchTerm,
  existingCodeSet,
  existingCodeSetObject
) => {
  let isTree = true;
  const codeDic = {};
  const combinedCodes = codes.concat(existingCodeSet);
  combinedCodes.forEach((v) => {
    if (!v.p) {
      console.log(v);
    }
    const parents = v.p;
    const ancestors = v.a;
    const codeForTerminology = getCodeForTerminology(v.clinicalCode, currentTerminology);
    if (!codeDic[codeForTerminology]) {
      codeDic[codeForTerminology] = {
        p: parents,
        a: ancestors,
        c: [],
        codes: [{ code: v.clinicalCode, t: v.t }],
      };
    } else if (codeDic[codeForTerminology].codes.length === 0) {
      codeDic[codeForTerminology].codes = [{ code: v.clinicalCode, t: v.t }];
      codeDic[codeForTerminology].p = parents;
      codeDic[codeForTerminology].a = ancestors;
    } else {
      codeDic[codeForTerminology].codes = [{ code: v.clinicalCode, t: v.t }];
      codeDic[codeForTerminology].p = parents;
      codeDic[codeForTerminology].a = ancestors;
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
  const inCodeSetAndMatched = [];
  const inCodeSetAndUnmatched = [];
  const notInCodeSetButMatched = [];
  const matchedDescendantButNotMatched = [];
  let numInCodeSetAndMatched = 0;
  let numInCodeSetAndUnmatched = 0;
  let numNotInCodeSetButMatched = 0;
  let numMatchedDescendantButNotMatched = 0;
  connectedSubgraphs.forEach((graph) => {
    const inCodeSetAndMatchedGraphToReturn = [];
    const inCodeSetAndUnmatchedGraphToReturn = [];
    const notInCodeSetButMatchedGraphToReturn = [];
    const matchedDescendantButNotMatchedGraphToReturn = [];

    Object.keys(graph).forEach((node) => {
      if (graph[node].codes.length === 0) {
        // graphToReturn.push({ code: node, description: '', depth: graph[node].depth });
      } else {
        graph[node].codes.forEach((code) => {
          const descriptionBits = parseDescriptionMultipleTermsNEW(code.t, code.descendant || code.synonym);
          const item = {
            code: code.code,
            ancestors: codeDic[getCodeForTerminology(code.code, currentTerminology)].a,
            description: descriptionBits.text,
            depth: graph[node].depth,
          };
          if (descriptionBits.match) {
            if (existingCodeSetObject[code.code]) {
              inCodeSetAndMatchedGraphToReturn.push(item);
              numInCodeSetAndMatched += 1;
              // delete existingCodeSet[code.code];
            } else if (
              existingCodeSetObject[getCodeForTerminology(code.code, currentTerminology)]
            ) {
              inCodeSetAndMatchedGraphToReturn.push(item);
              numInCodeSetAndMatched += 1;
              // delete existingCodeSet[getCodeForTerminology(code.code)];
            } else {
              notInCodeSetButMatchedGraphToReturn.push(item);
              numNotInCodeSetButMatched += 1;
            }
          } else if (existingCodeSetObject[code.code]) {
            inCodeSetAndUnmatchedGraphToReturn.push(item);
            numInCodeSetAndUnmatched += 1;
            // delete existingCodeSet[code.code];
          } else if (
            existingCodeSetObject[getCodeForTerminology(code.code, currentTerminology)]
          ) {
            inCodeSetAndUnmatchedGraphToReturn.push(item);
            numInCodeSetAndUnmatched += 1;
            // delete existingCodeSet[getCodeForTerminology(code.code)];
          } else {
            matchedDescendantButNotMatchedGraphToReturn.push(item);
            numMatchedDescendantButNotMatched += 1;
          }
        });
      }
    });

    if (inCodeSetAndMatchedGraphToReturn.length > 0) {
      inCodeSetAndMatched.push(inCodeSetAndMatchedGraphToReturn);
    }
    if (inCodeSetAndUnmatchedGraphToReturn.length > 0) {
      inCodeSetAndUnmatched.push(inCodeSetAndUnmatchedGraphToReturn);
    }
    if (notInCodeSetButMatchedGraphToReturn.length > 0) {
      notInCodeSetButMatched.push(notInCodeSetButMatchedGraphToReturn);
    }
    if (matchedDescendantButNotMatchedGraphToReturn.length > 0) {
      matchedDescendantButNotMatched.push(matchedDescendantButNotMatchedGraphToReturn);
    }
  });
  inCodeSetAndMatched.sort((b, a) => a.length - b.length);
  inCodeSetAndUnmatched.sort((b, a) => a.length - b.length);
  notInCodeSetButMatched.sort((b, a) => a.length - b.length);
  matchedDescendantButNotMatched.sort((b, a) => a.length - b.length);
  return {
    inCodeSetAndMatched,
    inCodeSetAndUnmatched,
    notInCodeSetButMatched,
    matchedDescendantButNotMatched,
    numInCodeSetAndMatched,
    numInCodeSetAndUnmatched,
    numNotInCodeSetButMatched,
    numMatchedDescendantButNotMatched,
  };
};

const getHierarchies = (codes, currentTerminology) => {
  let isTree = true;
  const codeDic = {};
  codes.forEach((v) => {
    if (!v.p) {
      console.log(v);
    }
    const parents = v.p;
    const ancestors = v.a;
    const codeForTerminology = getCodeForTerminology(v.clinicalCode, currentTerminology);
    if (!codeDic[codeForTerminology]) {
      codeDic[codeForTerminology] = {
        p: parents,
        a: ancestors,
        c: [],
        codes: [{ code: v.clinicalCode, t: v.t, descendant: v.descendant, synonym: v.synonym }],
      };
    } else if (codeDic[codeForTerminology].codes.length === 0) {
      codeDic[codeForTerminology].codes.push({ code: v.clinicalCode, t: v.t, descendant: v.descendant, synonym: v.synonym });
      codeDic[codeForTerminology].p = parents;
      codeDic[codeForTerminology].a = ancestors;
    } else {
      codeDic[codeForTerminology].codes.push({ code: v.clinicalCode, t: v.t, descendant: v.descendant, synonym: v.synonym });
      codeDic[codeForTerminology].p = parents;
      codeDic[codeForTerminology].a = ancestors;
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
  const matchedDescendantButNotMatchedConnectedSubgraphs = [];
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
          const descriptionBits = parseDescriptionMultipleTermsNEW(code.t, code.descendant || code.synonym);
          const item = {
            code: code.code,
            ancestors: codeDic[getCodeForTerminology(code.code, currentTerminology)].a,
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
      matchedDescendantButNotMatchedConnectedSubgraphs.push(unmatchedGraphToReturn);
    }
  });
  matchedCodesConnectedSubgraphs.sort((b, a) => a.length - b.length);
  matchedDescendantButNotMatchedConnectedSubgraphs.sort((b, a) => a.length - b.length);
  return {
    matched: matchedCodesConnectedSubgraphs,
    unmatched: matchedDescendantButNotMatchedConnectedSubgraphs,
    numMatched,
    numUnmatched,
  };
};

const getHierarchy = (codes, currentTerminology, searchTerm) => {
  let isTree = true;
  const codeDic = {};
  codes.forEach((v) => {
    const parents = v.p;
    const codeForTerminology = getCodeForTerminology(v.clinicalCode, currentTerminology);
    if (!codeDic[codeForTerminology]) {
      codeDic[codeForTerminology] = { p: parents, c: [], codes: [{ code: v.clinicalCode, t: v.t }] };
    } else if (codeDic[codeForTerminology].codes.length === 0) {
      codeDic[codeForTerminology].codes.push({ code: v.clinicalCode, t: v.t });
      codeDic[codeForTerminology].p = parents;
    } else {
      codeDic[codeForTerminology].codes.push({ code: v.clinicalCode, t: v.t });
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
            description: parseDescriptionMultipleTerms(code.t, searchTerm),
            depth: graph[node].depth,
          });
        });
      }
    });

    return graphToReturn;
  }).sort((b, a) => a.length - b.length);
  return connectedSubgraphs;
};

export {
  getHierarchiesWithExistingCodeList,
  getHierarchies,
  getHierarchy,
};
