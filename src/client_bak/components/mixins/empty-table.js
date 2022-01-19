export default id => `
<div class="clusterize">
  <table class="table my-table table-condensed" id="${`headers-${id}`}">
    <thead>
      <tr>
        <th>Code</th>
        <th>Description(s)</th>
        <th>Ancestor code(s)</th>
        <th>Parent(s)</th>
      </tr>
    </thead>
  </table>
  <div class="clusterize-scroll" id="${`scroll-${id}`}">
    <table class="table my-table table-condensed">
      <tbody class="clusterize-content" id="${`content-${id}`}">
        <tr class="clusterize-no-data">
          <td>Loading...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;
