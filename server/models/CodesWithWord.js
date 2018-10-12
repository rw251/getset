const mongoose = require('mongoose');

const CodesWithWordSchema = new mongoose.Schema({
  _id: String, // The clinical code
  t: String, // A | separated list of
  words: [String],
}, { collection: 'codesWithWords' });

module.exports = mongoose.model('CodesWithWord', CodesWithWordSchema);
