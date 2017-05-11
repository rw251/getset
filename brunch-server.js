const express = require('express');
const path = require('path');
const logger = require('express-pino-logger');
const bodyParser = require('body-parser');
const passport = require('passport');
const expressSession = require('express-session');
const flash = require('express-flash');
const dotenv = require('dotenv');
const config = require('./server/config');
const mongoose = require('mongoose');
const http = require('http');

const DEBUG = true;

dotenv.load({ path: '.env' });

const routes = require('./server/routes/index')(passport);

module.exports = function brunchServer(PORT, PATH, CALLBACK) {
  const app = express();

  mongoose.set('debug', DEBUG);
  mongoose.Promise = global.Promise;
  mongoose.connect(config.db.url);
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
  });

  let port = PORT || config.server.port;
  if (!port) port = process.env.PORT || '3000';
  app.set('port', port);
  app.set('views', path.join(__dirname, 'server/views'));
  app.set('view engine', 'pug');
  // app.use(expressStatusMonitor());
  // app.use(compression());

  // uncomment after placing your favicon in /public
  // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  // app.use(expressValidator());
  app.use(expressSession({
    secret: config.passport.secret,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.use('/', routes);

  app.use(express.static(path.join(__dirname, PATH)));

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    console.log(req.headers);
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use((err, req, res) => {
      res.status(err.status || 500);
      res.render('pages/error.jade', {
        message: err.message,
        error: err,
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('pages/error.jade', {
      message: err.message,
      error: {},
    });
  });


  /**
   * Create HTTP server.
   */

  const server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */

  /**
   * Event listener for HTTP server "error" event.
   */

  const onError = function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  /**
   * Event listener for HTTP server "listening" event.
   */

  const onListening = function onListening() {
    CALLBACK();
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
};
