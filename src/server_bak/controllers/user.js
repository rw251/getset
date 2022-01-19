const User = require('../models/User');

/**
 * POST /login
 * Sign in using email and password.
 */

// exports.postLogin = (req, res, next) => {
//   req.assert('email', 'Email is not valid').isEmail();
//   req.assert('password', 'Password cannot be blank').notEmpty();
//   req.sanitize('email').normalizeEmail({ remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/login');
//   }

//   return passport.authenticate('local', (err, user, info) => {
//     if (err) { return next(err); }
//     if (!user) {
//       req.flash('errors', info);
//       return res.redirect('/login');
//     }
//     return req.logIn(user, (errLogin) => {
//       if (errLogin) { return next(errLogin); }
//       req.flash('success', { msg: 'Success! You are logged in.' });
//       return res.redirect(req.session.returnTo || '/');
//     });
//   })(req, res, next);
// };

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
    if (err) { return next(err); }
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
