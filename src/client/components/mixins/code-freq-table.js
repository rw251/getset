export default codes => `
<table class="table table-condensed">
  <thead>
    <tr>
      <th>Term</th>
      <th>Frequency in code set</th>
      <th>Frequency in terminology</th>
      <th>Relative frequency (higher better)</th>
    </tr>
  </thead>
  <tbody>
    ${codes.map(code => `
    <tr>
      <td>${code.term}</td>
      <td>${code.freq}</td>
      <td>${code.n}</td>
      <td>${`${(100 * (code.freq / code.n)).toFixed(1)}%`}</td>
    </tr>
    `).join('')}    
  </tbody>
</table>
`;
