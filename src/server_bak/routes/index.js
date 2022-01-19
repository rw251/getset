const apiRoutes = require('./api');
const authRoutes = require('./auth');

require('../passport');

module.exports = (app) => {
  app.use('/api', apiRoutes);
  app.use('/auth', authRoutes);
};
