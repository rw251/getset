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

const ENV = {
  // mongo url
  MONGO_URL: mustExist('MONGODB_URI'),

  // other mongo urls
  MONGO_URL_EMIS: process.env.MONGODB_URI_EMIS,

  // passport secret for expressjs authentication
  PASSPORT_SECRET: mustExist('GETSET_PASSPORT_SECRET'),

  // server details
  SERVER_PORT: process.env.GETSET_SERVER_PORT,
  // SERVER_URL: mustExist('PINGR_SERVER_URL'),

};

module.exports = {
  // user auth
  passport: { secret: ENV.PASSPORT_SECRET },
  client: { url: mustExist('GETSET_URL') },
  server: { port: ENV.SERVER_PORT },
  mode: process.env.MODE || 'development',
  rollbar: {
    rollbarClientToken: mustExist('GETSET_ROLLBAR_POST_CLIENT_TOKEN'),
    rollbarServerToken: mustExist('GETSET_ROLLBAR_POST_SERVER_TOKEN'),
  },
};
