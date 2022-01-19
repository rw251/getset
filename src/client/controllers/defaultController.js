import state from '../state';

export default function (template, data) {
  const templateData = data || {};
  if (state.user) templateData.user = state.user;
  const html = template(templateData);
  document.getElementById('mainContent').innerHTML = html;
}
