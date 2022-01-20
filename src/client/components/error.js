import title from './partials/title';

export default (data) => `
<div class="container">
  ${title()}
  <div class="row">
    <div class="col-sm-12">
      <div style="font-size: 2em;background: #f06e6e;border-radius: 5px;padding: 10px;color: #060827;">
        <p>Sorry, but it looks like GetSet isn't working at the moment.</p>
        <p>Please try again later.</p>
      </div>
      ${data && data.message ? `<p style="font-size: 1.2em">${data.message}</p>` : ''}
      ${data && data.stack ? `<pre style="height:500px">${data.stack}</pre>` : ''}
    </div>
  </div>
</div>
`;
