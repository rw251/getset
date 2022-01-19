export default codes => `
${codes.map(code => `
<tr>
  <td>${code._id || code.code}</td>
  <td>${code.t || code.description}</td>
  <td>${code.a}</td>
  <td>${code.p}</td>
</tr>
`).join('')}
`;
