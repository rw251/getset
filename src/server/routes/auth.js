const express = require('express');
const authController = require('../controllers/auth');
// const userController = require('../controllers/user');
const passport = require('passport');
// const utils = require('./utils');
const CONFIG = require('../config');
// The middleware to set up the parameters for the authenticate middleware.
const checkReturnTo = function checkReturnTo(req, res, next) {
  // Maybe unnecessary, but just to be sure.
  req.session = req.session || {};

  req.session.returnTo = req.query.returnTo;

  next();
};

const router = express.Router();

// router.get('/isLoggedIn', authController.isLoggedIn);
router.get('/user', authController.getUser);

// router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// router.post('/account/delete', utils.isAuthenticated, userController.postDeleteAccount);

router.get('/github', checkReturnTo, passport.authenticate('github'));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(CONFIG.client.url + (req.session.returnTo || '/'));
  }
);

const thing = (req, res, next) => {
  // get_payload_request(request)
  // verify_webhook_signature
  // authenticate_app

  // // Authenticate the app installation in order to run API operations
  // authenticate_installation(@payload)
  next();
};
router.post('/github/webhook');

module.exports = router;
