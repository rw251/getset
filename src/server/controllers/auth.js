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
 * GET /logout
 * Log out.
 */

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};
