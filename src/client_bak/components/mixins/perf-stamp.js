export default (title, perf, status, id) => `
<div class="token ${`token-${status}`}" data-panel-id=${id}>
  <div class="token-content">
    <span class="token-perf">${perf}</span> 
    <span class="token-title">${title}</span>
  </div>
</div>
`;

// mixin perfStamp(title, perf, status, id)
//   .token(class='token-'+status,data-panel-id=id)
//     .token-content
//       span.token-perf= perf
//       |
//       span.token-title= title
