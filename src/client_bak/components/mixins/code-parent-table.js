export default parentCodes => `
<table class="table table-condensed">
  <thead>
    <tr>
      <th colspan="2">
        <button class="addSelectedMissingCodes btn btn-success">Add selected</button>
      </th>
    </tr>
    <tr>
      <th>Code</th>
      <th>Description(s)</th>
      <th>
        <input id="missingCodeCheckAll" type="checkbox" checked="checked" />
      </th>
    </tr>
  </thead>
  <tbody>
    ${parentCodes.filter(parent => !parent.exclude).map(parent => `
    <tr class="parent-row">
      <td>${parent._id || parent.code}</td>
      <td>${parent.t || parent.description}</td>
      <td>
        INCLUDED
        <button class="removeParentCode btn btn-danger" data-code="${parent.code}">Remove</button>
        ${parent.codes.filter(code => !code.exclude).map(code => `
        <tr class="child-row">
          <td class="pre">${` ${code._id || code.code}`}</td>
          <td>${code.t || code.description}</td>
          <td>
            <input class="missingCode" type="checkbox" name="missingCodeundefined" checked="checked" value="${code._id || code.code}"/>
          </td>
        </tr>
        `).join('')}
      </td>
    </tr>
    `).join('')}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">
        <button class="addSelectedMissingCodes btn btn-success">Add selected</button>
      </td>
    </tr>
  </tfoot>
</table>
`;
