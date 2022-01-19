export default (title, message, buttonLink, buttonText) => `
  <div class="container container-small">
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="btn-toolbar">
      <a class="btn btn-info btn-block" href="javascript:void(0)" data-href="${buttonLink}">
        <i class="fas fa-arrow-circle-left"></i> ${buttonText}
      </a>
    </div>
  </div>
`;
