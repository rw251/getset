const mongoose = require('mongoose');

module.exports = ({ id, version }) => {
  const WordSchema = new mongoose.Schema(
    {
      _id: String, // The word
      n: Number, // Frequency of words
    },
    { autoIndex: false, collection: `words-${id}-${version}` }
  );

  return mongoose.model(`Word${id}${version}`, WordSchema);
};
