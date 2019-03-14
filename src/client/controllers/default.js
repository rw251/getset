import state from '../scripts/state';

export default function (template, data) {
  const templateData = data || {};
  if (state.user) templateData.user = state.user;
  const html = template(templateData);
  $('#mainContent').html(html);
}
