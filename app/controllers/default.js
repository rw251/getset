const $ = require('jquery');
const global = require('../scripts/global');

module.exports = (template, data) => {
  const templateData = data || {};
  if (global.user) templateData.user = global.user;
  const html = template(templateData);
  $('#mainContent').html(html);
};
