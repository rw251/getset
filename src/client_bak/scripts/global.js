import localforage from 'localforage';

const syncToLocal = (o, callback) => {
  localforage.setItem('o', o, callback);
};
const syncFromLocal = (callback) => {
  localforage.getItem('o').then((o) => {
    callback(o || { e: {}, s: {} });
  });
};

export {
  syncToLocal,
  syncFromLocal,
};
