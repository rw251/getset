export default graph => `
${graph.map(subgraph => subgraph.filter(item => !item.exclude && !item.excludedByParent).map(item => `
  <tr>
    <td class="disable-select">${item.code}</td>
    <td>${item.description}</td>
    <td class="disable-select">${item.depth}</td>
    <td class="disable-select">${item.p}</td>
  </tr>
  `)).join('')}`;
