const mongoose = require('mongoose');

module.exports = (terminologyName) => {
  const WordSchema = new mongoose.Schema({
    _id: String, // The word
    n: Number, // Frequency of words
  }, { autoIndex: false, collection: `words-${terminologyName}` });

  return mongoose.model(`Word${terminologyName}`, WordSchema);
};
