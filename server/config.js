const pino = require('pino')();

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
  MONGO_URL: mustExist('GETSET_MONGO_URL'),

  // passport secret for expressjs authentication
  PASSPORT_SECRET: mustExist('GETSET_PASSPORT_SECRET'),

  // server details
  SERVER_PORT: process.env.GETSET_SERVER_PORT,
  //SERVER_URL: mustExist('PINGR_SERVER_URL'),

};

module.exports = {
  db: {
    url: ENV.MONGO_URL,
  },
  // user auth
  passport: {
    secret: ENV.PASSPORT_SECRET,
  },
  server: {
    port: ENV.SERVER_PORT,
  },
  mode: process.env.MODE || 'development',
};
