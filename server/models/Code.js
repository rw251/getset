const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
  _id: String, // The clinical code
  t: String, // A | separated list of
  p: String,
});

module.exports = mongoose.model('Code', CodeSchema);
