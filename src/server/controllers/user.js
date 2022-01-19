const User = require('../models/User');

/**
 * GET /logout
 * Log out.
 */

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * POST /account/delete
 * Delete user account.
 */

exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    return res.redirect('/');
  });
};

exports.githubUsers = (callback) => {
  User.find({ 'github.username': { $exists: true } }, (err, users) => {
    if (err) {
      console.log(err);
      return callback(err);
    }
    return callback(null, users);
  });
};
