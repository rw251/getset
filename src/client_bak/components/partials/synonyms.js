export default ({ synonyms }) => `
<div>
  ${synonyms.map(synonym => `
    <div class="alert alert-success alert-dismissible" data-value="${synonym}" role="alert">
      <button class="close" type="button" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>${synonym}
    </div>
  `).join('')}
</div>
`;

// div
//   each synonym in synonyms
//     .alert.alert-success.alert-dismissible(data-value=synonym,role="alert")
//       button.close(type="button",data-dismiss="alert",aria-label="Close")
//         span(aria-hidden="true") &times;
//       = synonym
