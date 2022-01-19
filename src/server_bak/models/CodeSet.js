const mongoose = require('mongoose');

const codeSetSchema = new mongoose.Schema({
  name: String,
  description: String,
  user: {
    name: String,
    email: String,
    githubUsername: String,
  },
  repoUrl: String,
  createdOn: Date,
  lastUpdated: Date,
  terminologies: [String],
  count: Number,
});


module.exports = mongoose.model('CodeSet', codeSetSchema);
