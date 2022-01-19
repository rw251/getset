export default (message, type) => `
    <div class="alert alert-${type} alert-dismissable" role="alert" style="font-size: 1.5em">
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      ${message}
    </div>
  `;
