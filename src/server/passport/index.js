/* eslint no-underscore-dangle: ["error", { "allow": ["_json"] }] */
/* _json comes from github so have to make it an exception for eslint */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const github = require('../controllers/github');
const CONFIG = require('../config');

const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    return user.comparePassword(password, (errComparePassword, isMatch) => {
      if (errComparePassword) { return done(errComparePassword); }
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: 'Invalid email or password.' });
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: `${CONFIG.client.url}/auth/github/callback`,
  passReqToCallback: true,
  scope: ['user:email', 'public_repo'],
}, (req, accessToken, refreshToken, profile, done) => {
  console.log(`PROTIEL: ${JSON.stringify(profile)}`);
  if (req.user) {
    User.findOne({ 'github.id': profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (errFind, userFromDb) => {
          const user = userFromDb;
          if (errFind) { return done(errFind); }
          user.github = {
            id: profile.id,
            username: profile.username,
          };
          if (!user.tokens) user.tokens = {};
          user.tokens.github = accessToken;
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.avatar_url;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.website = user.profile.website || profile._json.blog;
          return user.save((errSave) => {
            req.flash('info', { msg: 'GitHub account has been linked.' });
            done(errSave, user);
          });
        });
      }
    });
  } else {
    User.findOne({ 'github.id': profile.id }, (err, existingUser) => {
      if (err) { return done(err); }

      if (existingUser) {
        existingUser.tokens.github = accessToken;
        return existingUser.save((updateErr, updateduser) => {
          if (updateErr) {
            return done(updateErr);
          }
          return github.createUsersGetSetRepo(updateduser, () => done(null, updateduser));
        });
      }
      return User.findOne({ email: profile._json.email }, (errFind, existingEmailUser) => {
        if (errFind) { return done(errFind); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
          return done(err);
        }
        const user = new User();
        user.email = profile._json.email;
        if (profile.emails && profile.emails.length > 0) {
          profile.emails.forEach((email) => {
            if (email.primary && email.value) user.email = email.value;
          });
        }
        if (!user.email) {
          req.flash('errors', { msg: "You don't have an email address associated with your github account so we can't sign you up this way" });
          return done(err);
        }
        user.github = {
          id: profile.id,
          username: profile.username,
        };
        if (!user.tokens) user.tokens = {};
        user.tokens.github = accessToken;
        user.profile.name = profile.displayName;
        user.profile.picture = profile._json.avatar_url;
        user.profile.location = profile._json.location;
        user.profile.website = profile._json.blog;
        return user.save((errSave) => {
          done(errSave, user);
        });
      });
    });
  }
}));

/**
 * Login Required middleware.
 */

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */

exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.user.tokens[provider];
  if (token) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
