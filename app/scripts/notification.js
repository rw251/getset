const $ = require('jquery');
const notificationTemplate = require('../../shared/templates/notification.jade');

const hide = () => {
  $('.notification').hide().remove();
};

const show = () => {
  $('.notification').show();
  setTimeout(() => {
    hide();
  }, 3000);
};

exports.show = (text) => {
  // Get html from template
  const notificationHtml = notificationTemplate({ text });

  // Append to body then display
  const div = document.createElement('div');
  div.innerHTML = notificationHtml;
  document.body.appendChild(div.firstChild);

  show();
};
