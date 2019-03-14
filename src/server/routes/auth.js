const express = require('express');
const authController = require('../controllers/auth');
const passport = require('passport');
const CONFIG = require('../config');
// The middleware to set up the parameters for the authenticate middleware.
const checkReturnTo = function checkReturnTo(req, res, next) {
  // Maybe unnecessary, but just to be sure.
  req.session = req.session || {};

  req.session.returnTo = req.query.returnTo;

  next();
};

const router = express.Router();

router.get('/isLoggedIn', authController.isLoggedIn);
router.get('/user', authController.getUser);

router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.post('/forgot', authController.postForgot);
router.get('/reset/:token', authController.getReset);
router.post('/reset/:token', authController.postReset);
router.post('/signup', authController.postSignup);

router.get('/github', checkReturnTo, passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(CONFIG.client.url + (req.session.returnTo || '/'));
});

module.exports = router;
