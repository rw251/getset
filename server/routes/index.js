const express = require('express');
const passportConfig = require('../passport/index');
const homeController = require('../controllers/home');
const userController = require('../controllers/user');
const apiController = require('../controllers/api');
const codeController = require('../controllers/code');
const codeSetController = require('../controllers/codeSet');

const router = express.Router();

// const isAdmin = function (req, res, next) {
//   if (req.user.roles.indexOf('admin') > -1) return next();
//   res.redirect('/login');
// };

// The middleware to set up the parameters for the authenticate middleware.
const checkReturnTo = function checkReturnTo(req, res, next) {
  // Maybe unnecessary, but just to be sure.
  req.session = req.session || {};

  req.session.returnTo = req.query.returnTo;

  next();
};

module.exports = function routeIndex(passport) {
  /* GET login page. */
  router.get('/', homeController.index);
  router.get('/create', homeController.create);
  router.get('/search', homeController.search);
  router.get('/validate', homeController.validate);
  router.get('/enhance', homeController.enhance);
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

  router.get('/auth/github', checkReturnTo, passport.authenticate('github'));
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

  router.get('/code/search/:terminology/for/:searchterm', codeController.search);
  router.get('/code/search/:terminology/forlist', codeController.searchMultiple);
  router.post('/code/search', codeController.newSearchMultiple);

  router.post('/code/enhance', codeController.enhance);
  router.post('/code/unmatchedChildren', codeController.unmatchedChildren);
  router.get('/code/freq/:term', codeController.freq);
  router.post('/code/freqMult', codeController.freqMult);

  router.post('/save/to/github', codeSetController.create);

  router.get('/codesetlist', codeSetController.search);

  router.get('/codeset/:id', codeSetController.get);
  router.delete('/codeset/:id', codeSetController.delete);
  return router;
};
