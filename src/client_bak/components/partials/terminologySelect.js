const option = ({ id, version }) => `
  <option value="${id}-${version}">
    ${id} (version: ${version})
  </option>
`;

export default (terminologies) => `
  <div class="form-group">
    <select name="terminology" class="form-control">
      ${terminologies.map((terminology, i) => option(terminology, i)).join('')}
    </select>
  </div>`;
