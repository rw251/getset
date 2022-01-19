import state from './state';

// credentials: 'same-origin' is usually the default but not in some
// older browsers
const doGet = (url) =>
  fetch(url, { credentials: 'same-origin' }).then((response) => {
    if (response.status === 401) {
      // user not logged in

      // Race conditions if you navigate here - e.g. if 5 simultaneous requests all
      // reject because of auth issues we don't want 5 redirects to /login
      // global.Router.navigate('/login');
      return Promise.reject(new Error('Not logged in'));
    }
    if (response.status === 500) {
      // server might have crashed
      return Promise.reject(new Error('No response from server'));
    }
    if (response.status === 403) {
      return response.json();
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
  }).then((response) => {
    if (response.status === 401) {
      // typically dopostjson is not part of multiple requests
      // so it's ok to do redirect here. But first we throw an
      // error so that it can be dealt with by the component
      // e.g. to disply a message that it didn't work
      setTimeout(() => {
        global.Router.navigate('/login');
      }, 3000);
      return Promise.reject(new Error('Not logged in'));
    }
    return response.json();
  });

const doDelete = (url) =>
  fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((response) => {
    if (response.status === 401) {
      // user not logged in
      setTimeout(() => {
        global.Router.navigate('/login');
      }, 3000);
      return Promise.reject(new Error('Not logged in'));
    }
    return response.json();
  });

export default {
  // isLoggedIn: () => doGet('/auth/isLoggedIn'),
  getUser: () => doGet('/auth/user'),
  // codeSearch: (terms, terminology, version) =>
  //   doPostJson('/api/code/search', { terms, terminology, version }).catch(() => {}),
  // getCodeSet: (id) => doGet(`/api/codeset/${id}`),
  // getCodeSets: () => doGet('/api/codesetlist'),
  getTerminologies: () => doGet('/api/terminologies'),
  // deleteCodeSet: (id) => doDelete(`/api/codeset/${id}`),
  // saveToGithub: (data) => doPostJson('/api/save/to/github', data).catch(() => {}),
  // unmatchedChildren: (codes, terminology) =>
  //   doPostJson('/api/code/unmatchedChildren', { codes, terminology }).catch(() => {}),
};
