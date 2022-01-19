/* eslint no-underscore-dangle: ["error", { "allow": ["_json"] }] */
/* _json comes from github so have to make it an exception for eslint */

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
// const github = require('../controllers/github');
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
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: `${CONFIG.client.url}/auth/github/callback`,
      passReqToCallback: true,
      scope: ['user:email'],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      console.log(`PROFILE: ${JSON.stringify(profile)}`);

      const existingUser = await User.findOne({ 'github.id': profile.id }).exec();
      if (existingUser) {
        existingUser.tokens.github = { accessToken, refreshToken };
        await existingUser.save();
        // return github.createUsersGetSetRepo(updateduser, () => done(null, updateduser));
        return done(null, existingUser);
      }

      const user = new User();
      user.email = profile._json.email;
      if (profile.emails && profile.emails.length > 0) {
        profile.emails.forEach((email) => {
          if (email.primary && email.value) user.email = email.value;
        });
        if (!user.email) {
          profile.emails.forEach((email) => {
            if (email.value) user.email = email.value;
          });
        }
      }

      user.github = {
        id: profile.id,
        username: profile.username,
      };
      if (!user.tokens) user.tokens = {};
      user.tokens.github = { accessToken, refreshToken };
      user.profile.name = profile.displayName;
      user.profile.picture = profile._json.avatar_url;
      await user.save();
      return done(null, user);
    }
  )
);

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
