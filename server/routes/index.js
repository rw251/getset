const express = require('express');
const url = require('url');
const passportConfig = require('../passport/index');
const homeController = require('../controllers/home');
const userController = require('../controllers/user');
const apiController = require('../controllers/api');

const router = express.Router();

// const isAdmin = function (req, res, next) {
//   if (req.user.roles.indexOf('admin') > -1) return next();
//   res.redirect('/login');
// };

module.exports = function routeIndex(passport) {
  /* GET login page. */
  router.get('/', homeController.index);
  router.get('/login', userController.getLogin);
  router.post('/login', userController.postLogin);
  router.get('/logout', userController.logout);
  router.get('/forgot', userController.getForgot);
  router.post('/forgot', userController.postForgot);
  router.get('/reset/:token', userController.getReset);
  router.post('/reset/:token', userController.postReset);
  router.get('/signup', userController.getSignup);
  router.post('/signup', userController.postSignup);
  router.get('/account', passportConfig.isAuthenticated, userController.getAccount);
  router.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
  router.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
  router.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
  router.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

  router.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);

  router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
  router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });

  const originalURL = function (req, options) {
    options = options || {};
    const app = req.app;
    if (app && app.get && app.get('trust proxy')) {
      options.proxy = true;
    }
    const trustProxy = options.proxy;

    const proto = (req.headers['x-forwarded-proto'] || '').toLowerCase();
    console.log(`A: ${proto}`);
    const tls = req.connection.encrypted || (trustProxy && proto.split(/\s*,\s*/)[0] == 'https');
    console.log(`B: ${req.connection.encrypted}`);
    console.log(`B: ${trustProxy}`);
    console.log(`B: ${proto.split(/\s*,\s*/)[0]}`);
    console.log(`B: ${tls}`);
    const host = (trustProxy && req.headers['x-forwarded-host']) || req.headers.host;
    console.log(`C: ${host}`);
    const protocol = tls ? 'https' : 'http';
    console.log(`D: ${protocol}`);
    const path = req.url || '';
    console.log(`E: ${path}`);
    return `${protocol}://${host}${path}`;
  };
  router.get('/auth/github', (req, res, next) => {
    const parsed = url.parse('/auth/github/callback');
    console.log(parsed);
    console.log(`PROTOCOL: ${parsed.protocol}`);
    const urll = url.resolve(originalURL(req, { proxy: this._trustProxy }), '/auth/github/callback');
    console.log(urll);
    next();
  }, passport.authenticate('github'));
  router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  router.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
  router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  router.get('/auth/twitter', passport.authenticate('twitter'));
  router.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  return router;
};
