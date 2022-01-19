import page from 'page';
import state from './state';

// credentials: 'same-origin' is usually the default but not in some
// older browsers
const doGet = (url) =>
  fetch(url, { credentials: 'same-origin' }).then((response) => {
    if (response.status === 401) {
      // user not logged in
      page('/login');
      return Promise.reject(new Error('Not logged in'));
    }
    if (response.status === 403) {
      return response.json();
    }
    if (response.status === 503) {
      return response.json().then((error) => {
        state.error = error;
        page('/error');
        return Promise.reject(new Error('Server error'));
      });
    }
    return response.json();
  });

const doPostJson = (url, dataToSend) =>
  fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(dataToSend),
  }).then((response) => response.json());

const doDelete = (url) =>
  fetch(url, { method: 'DELETE', credentials: 'same-origin' }).then((response) => response.json());

export default {
  isLoggedIn: () => doGet('/auth/isLoggedIn'),
  getUser: () => doGet('/auth/user'),

  codeSearch: (terms, terminology, version) =>
    doPostJson('/api/code/search', { terms, terminology, version }).catch(() => {}),
  getCodeSet: (id) => doGet(`/api/codeset/${id}`),
  getCodeSets: () => doGet('/api/codesetlist'),

  getTerminologies: () => doGet('/api/terminologies'),

  deleteCodeSet: (id) => doDelete(`/api/codeset/${id}`),

  saveToGithub: (data) => doPostJson('/api/save/to/github', data).catch(() => {}),

  unmatchedChildren: (codes, terminology) =>
    doPostJson('/api/code/unmatchedChildren', { codes, terminology }).catch(() => {}),
};
