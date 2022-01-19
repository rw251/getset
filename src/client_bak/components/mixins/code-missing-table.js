export default codes => `
<table class="table table-condensed">
  <thead>
    <tr>
      <th colspan="2">
        <button class="removeSelectedUnfoundCodes btn btn-danger">Remove selected</button>
      </th>
    </tr>
    <tr>
      <th>Code</th>
      <th>
        <input id="unfoundCodeCheckAll" type="checkbox" checked="checked" />
      </th>
    </tr>
  </thead>
  <tbody>
    ${codes.map((code, idx) => `
    <tr>
      <td>${code}</td>
      <td>
        <input class="unfoundCode" type="checkbox" name=${`unfoundCode${idx}`} checked="checked" value="${code}" />
      </td>
    </tr>
    `).join('')}    
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">
        <button class="removeSelectedUnfoundCodes btn btn-danger">Remove selected</button>
      </td>
    </tr>
  </tfoot>
</table>
`;
