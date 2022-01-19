exports.isLoggedIn = (req, res) => {
  res.send({ isLoggedIn: req.isAuthenticated() });
};

exports.getUser = (req, res) => {
  if (req.user) {
    const { email, profile } = req.user;
    res.send({ email, profile });
  } else {
    res.send(false);
  }
};

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
