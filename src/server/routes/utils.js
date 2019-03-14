const isAdmin = req => req.user && req.user.roles.includes('admin');

exports.isAuthenticated = (req, res, next) => {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated()) { return next(); }

  return res.status(401).send('You need to be logged in to make this request');
};

exports.isAdmin = (req, res, next) => (isAdmin(req)
  ? next()
  : res.status(403)
    .send({
      status: 'error',
      message: 'Tut tut... This is only available to admin users.',
    }));
