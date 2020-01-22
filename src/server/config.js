const dotenv = require('dotenv');
const pino = require('pino')();

dotenv.load({ path: '.env' });

const mustExist = function mustExist(name) {
  if (!process.env[name]) {
    pino.fatal(`${name} is not defined but is mandatory.`);
    pino.info('Exiting...');
    return process.exit(1);
  }
  return process.env[name];
};

module.exports = {
  mongoUrl: mustExist('MONGODB_URI'),
  passport: { secret: mustExist('GETSET_PASSPORT_SECRET') },
  client: { url: mustExist('GETSET_URL') },
  server: { port: process.env.GETSET_SERVER_PORT || process.env.PORT },
  mode: process.env.MODE || 'development',
  rollbarClientToken: mustExist('GETSET_ROLLBAR_POST_CLIENT_TOKEN'),
  rollbarServerToken: mustExist('GETSET_ROLLBAR_POST_SERVER_TOKEN'),
};
