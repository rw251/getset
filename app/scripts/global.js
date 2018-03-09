const localforage = require('localforage');

module.exports = {
  isLoggedIn: false,
  user: false,

  syncToLocal: (o, callback) => {
    localforage.setItem('o', o, callback);
  },
  syncFromLocal: (callback) => {
    localforage.getItem('o').then((o) => {
      callback(o);
    });
  },
};
