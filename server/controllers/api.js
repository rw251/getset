const GitHub = require('github');

/**
 * GET /api
 * List of API examples.
 */

exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples',
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */

exports.getGithub = (req, res, next) => {
  const github = new GitHub();
  github.repos.get({ owner: 'sahat', repo: 'hackathon-starter' }, (err, repo) => {
    if (err) { return next(err); }
    return res.render('api/github', {
      title: 'GitHub API',
      repo,
    });
  });
};
