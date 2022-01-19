const mongoose = require('mongoose');

let terminologies = [];

const processCollections = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  terminologies = [];
  const termObj = {};
  collections.forEach((collection) => {
    const [codesOrWords, id, version] = collection.name.split('-');
    if (id && version) {
      if (!termObj[id]) termObj[id] = {};
      if (!termObj[id][version]) {
        termObj[id][version] = {
          hasCodes: codesOrWords === 'codes',
          hasWords: codesOrWords === 'words',
        };
      } else if (
        (termObj[id][version].hasCodes && codesOrWords === 'words') ||
        (termObj[id][version].hasWords && codesOrWords === 'codes')
      ) {
        terminologies.push({ id, version });
      }
    }
  });
};

const getTerminologies = async () => {
  if (terminologies.length > 0) return terminologies;
  await processCollections();
  return terminologies;
};

exports.getTerminologies = async (req, res, next) => {
  try {
    await getTerminologies();
  } catch (err) {
    return next(err);
  }
  return res.send(terminologies);
};
