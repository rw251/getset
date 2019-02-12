import tippy from 'tippy.js';

const utils = require('../scripts/utils');

let includeTerms = ['diabetes'];
let excludeTerms = ['history of', 'assessment'];

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
      codeLookup[utils.getCodeForTerminology(code.id, terminology)] = i;
    });
    graph.counts.included = codes.map(() => 0);
    graph.counts.excluded = codes.map(() => 0);
    graph.counts.unknown = codes.map(() => 0);
    graph.nodes = codes.map((x, i) => ({
      id: i,
      terms: x.t.split('|'),
      label: x.t.split('|')[0],
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

const processLabelForMatches = (label) => {
  let isDone = false;
  let labelToReturn = label;
  excludeTerms.forEach((term) => {
    const firstLocation = labelToReturn.toLowerCase().indexOf(term.toLowerCase());
    if (!isDone && firstLocation > -1) {
      labelToReturn =
        `${labelToReturn.substr(0, firstLocation)
        }<span class="excluded-reason">${
          labelToReturn.substr(firstLocation, term.length)
        }</span>${
          labelToReturn.substr(firstLocation + term.length)}`;
      isDone = true;
    }
  });
  includeTerms.forEach((term) => {
    const firstLocation = labelToReturn.toLowerCase().indexOf(term.toLowerCase());
    if (!isDone && firstLocation > -1) {
      labelToReturn =
        `${labelToReturn.substr(0, firstLocation)
        }<span class="included-reason">${
          labelToReturn.substr(firstLocation, term.length)
        }</span>${
          labelToReturn.substr(firstLocation + term.length)}`;
      isDone = true;
    }
  });
  return labelToReturn;
};

const html = {
  createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
  },

  getShallowNodeHTML({ id, label }) {
    return (
      `<div class="node shallow" data-id="${
        id
      }"><div class="item"><i class="fas no-click fa-caret-down fa-fw"></i><span>${
        label
      }</span></div></div>`
    );
  },

  getTooltipHTML(nodeId, descendants = {}) {
    const node = graph.nodes[nodeId];
    const includedDescendantCount = descendants.included || 0;
    const excludedDescendantCount = descendants.excluded || 0;
    const unknownDescendantCount = descendants.unknown || 0;
    const totalDescendants = includedDescendantCount
                           + excludedDescendantCount
                           + unknownDescendantCount;
    const descendantStatuses = totalDescendants === 0
      ? ''
      : [
        `<span class='pill included'>Included: ${includedDescendantCount}</span>`,
        `<span class='pill excluded'>Excluded: ${excludedDescendantCount}</span>`,
        `<span class='pill unknown'>Unknown: ${unknownDescendantCount}</span>`,
      ].join(' ');
    const status = node.included
      ? '<span class=\'pill included\'>Included</span>'
      : node.excluded
        ? '<span class=\'pill excluded\'>Excluded</span>'
        : '<span class=\'pill unknown\'>Unknown</span>';
    return `
      <p>Code: ${node.code}, Status: ${status}</p>
      <p>Descendant codes: ${totalDescendants}<br>${descendantStatuses}</p>
      <p>Terms:
        <ul>
          <li>${node.terms.join('</li><li>')}</li>
        </ul>
      </p>
  `;
  },

  getLeafHTML(id, label, isIncluded, isExcluded) {
    let className = 'fa-question-circle';
    if (isIncluded) className = 'fa-check';
    if (isExcluded) className = 'fa-times';
    return `
      <div class="node item">
        <i class="fas no-click ${className} fa-shrink fa-fw fa-lg"></i>
        <span class="count"></span>
        <span class="label">${processLabelForMatches(label)}</span>
        <i 
          class="fas ml-10 fa-info-circle" 
          data-tippy-content="${html.getTooltipHTML(id)}"
        ></i>
      </div>`;
  },

  getNodeHTML({ id, label, descendants, children }) {
    const includedDescendantCount = descendants.included;
    const excludedDescendantCount = descendants.excluded;
    const unknownDescendantCount = descendants.unknown;

    let className = 'fa-question-circle';
    if (graph.nodes[id].included) className = 'fa-check';
    if (graph.nodes[id].excluded) className = 'fa-times';

    return `
      <div class="node" data-id="${id}">
        <div class="item">
          <i class="fas no-click fa-caret-down fa-lg fa-fw"></i>
          <i class="fas no-click ${className} fa-xs fa-fw"></i>
          <span class="statusCount included ${includedDescendantCount ||
            'noChildren'}">
            <i class="fas fa-check fa-fw"></i>
            <span class="count">${includedDescendantCount}</span>
          </span>
          <span class="statusCount excluded ${excludedDescendantCount ||
            'noChildren'}">
            <i class="fas fa-times fa-fw"></i>
            <span class="count">${excludedDescendantCount}</span>
          </span>
          <span class="statusCount unknown ${unknownDescendantCount ||
            'noChildren'}">
            <i class="fas fa-question-circle fa-fw"></i>
            <span class="count">${unknownDescendantCount}</span>
          </span>
          <span class="label">${processLabelForMatches(label)}</span>
          <i 
            class="fas ml-10 fa-info-circle" 
            data-tippy-content="${html.getTooltipHTML(id, descendants)}"
          ></i>
        </div>
        <div class="children closed">
          ${children
    .map(node => (node.hasChildren
      ? html.getShallowNodeHTML(node)
      : html.getLeafHTML(node.id, node.label, node.included, node.excluded)))
    .join('')}
        </div>
      </div>`;
  },

  getRootHTML() {
    return graph.roots
      .sort((a, b) => graph.edges[b].length - graph.edges[a].length)
      .map(root => (graph.edges[root].length > 0
        ? html.getNodeHTML({
          id: graph.nodes[root].id,
          label: graph.nodes[root].label,
          descendants: graph.nodes[root].descendants,
          children: graph.getShallowChildren(root),
        })
        : html.getLeafHTML(
          graph.nodes[root].id,
          graph.nodes[root].label,
          graph.nodes[root].included,
          graph.nodes[root].excluded
        )))
      .join('');
  },
};

function setupItemClick() {
  let isDragging = false;
  let startingPosition = [0, 0];

  const isElementAnItem = e => e.target.classList.contains('item');
  const isChildrenExpanded = e => e.target.children[0].classList.contains('rotated');

  function expandChildren(e) {
    const icon = e.target.children[0];
    icon.classList.add('rotated');
    const item = icon.parentNode;
    const children = item.nextElementSibling;
    let parent = item.parentNode;

    if (children) {
      children.style.maxHeight = `${children.scrollHeight}px`;
      children.classList.remove('closed');

      while (
        parent.classList.contains('node') ||
        parent.classList.contains('children')
      ) {
        parent.style.maxHeight = null;
        parent = parent.parentNode;
      }
    }

    [].forEach.call(children.childNodes, (node) => {
      if (node.classList && node.classList.contains('shallow')) {
        const nodeId = node.dataset.id;

        node.parentNode.replaceChild(
          html.createElementFromHTML(html.getNodeHTML({
            id: nodeId,
            label: graph.nodes[nodeId].label,
            descendants: graph.nodes[nodeId].descendants,
            children: graph.getShallowChildren(nodeId),
          })),
          node
        );
        if (node.classList) node.classList.remove('shallow');
        tippy('[data-tippy-content]');
      }
    });
  }

  function collapseChildren(e) {
    const icon = e.target.children[0];
    const item = icon.parentNode;
    const children = item.nextElementSibling;
    if (children) {
      // temp disable transitions see:
      // https://stackoverflow.com/a/16575811/596639
      children.classList.add('notransition');
      children.style.maxHeight = `${children.scrollHeight}px`;
      children.offsetHeight;
      children.classList.remove('notransition');
      children.style.maxHeight = null;
      children.classList.add('closed');
    }
    icon.classList.remove('rotated');
  }

  function startDragging(e) {
    if (isElementAnItem(e)) {
      isDragging = false;
      startingPosition = [e.pageX, e.pageY];
    }
  }

  function doDragging(e) {
    if (isElementAnItem(e) && !isDragging) {
      if (!(e.pageX === startingPosition[0] && e.pageY === startingPosition[1])) {
        isDragging = true;
      }
    }
  }

  function toggleExpand(e) {
    if (isElementAnItem(e) && !isDragging) {
      isChildrenExpanded(e)
        ? collapseChildren(e)
        : expandChildren(e);
    }
    isDragging = false;
    startingPosition = [];
  }
  // Need to make sure the click is not part of a drag gesture
  document.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', doDragging);
  document.addEventListener('click', toggleExpand);
}

const initialHtml = (codes, include, exclude, terminology) => {
  includeTerms = include;
  excludeTerms = exclude;

  console.time('initializeGraph');
  graph.initializeGraph(codes, terminology);
  console.timeEnd('initializeGraph');

  return html.getRootHTML();
};

const wireUp = () => {
  setupItemClick();
  // Tooltip setup
  tippy.setDefaults({
    placement: 'bottom-end',
    followCursor: 'initial',
    animateFill: false,
    animation: 'fade',
    trigger: 'mouseenter focus click',
    theme: 'my',
    maxWidth: 600,
  });
  tippy('[data-tippy-content]');
};

export { initialHtml, wireUp };