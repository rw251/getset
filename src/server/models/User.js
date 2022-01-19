const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    github: {
      id: String,
      username: String,
    },
    tokens: { github: { accessToken: String, refreshToken: String } },
    profile: {
      name: String,
      picture: String,
    },
  },
  { timestamps: true }
);

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size = 200) {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
