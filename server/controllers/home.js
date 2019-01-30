/**
 * GET /
 * Home page.
 */

exports.index = (req, res) => {
  res.render('home', {
    title: 'Home',
    user: req.user,
  });
};

exports.create = (req, res) => {
  res.render('home', {
    title: 'Create',
    user: req.user,
  });
};

exports.convert = (req, res) => {
  res.render('home', {
    title: 'Convert',
    user: req.user,
  });
};

exports.search = (req, res) => {
  res.render('home', {
    title: 'Search',
    user: req.user,
  });
};

exports.validate = (req, res) => {
  res.render('home', {
    title: 'Validate',
    user: req.user,
  });
};

exports.enhance = (req, res) => {
  res.render('home', {
    title: 'Enhance',
    user: req.user,
  });
};
