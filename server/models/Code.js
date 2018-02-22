const mongoose = require('mongoose');
const config = require('../config');

const CodeSchema = new mongoose.Schema({
  _id: String, // The clinical code
  t: String, // A | separated list of
  p: [String],
  a: String,
  c: [String],
});

module.exports = (terminology) => {
  let model = mongoose.model('Code', CodeSchema);
  switch (terminology) {
    case 'EMIS':
      if (config.MONGO_URL_EMIS) {
        model = mongoose.createConnection(config.MONGO_URL_EMIS).model('Code', CodeSchema);
      }
      break;
    default:
  }
  return model;
};
