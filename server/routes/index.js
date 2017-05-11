const express = require('express');
const passportConfig = require('../passport/index');
const homeController = require('../controllers/home');
const userController = require('../controllers/user');
const apiController = require('../controllers/api');
const codeController = require('../controllers/code');

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

  router.get('/auth/github', passport.authenticate('github'));
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

  router.get('/code/search/:terminology/:searchterm', codeController.search);
  return router;
};
