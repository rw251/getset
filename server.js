const server = require('./brunch-server.js');
const pino = require('pino')();

server(process.env.PORT || 4002, 'dist', () => {
  pino.info(`Server listening on ${process.env.PORT || 4002}`);
});

pino.info('Attempting to start the server...');
