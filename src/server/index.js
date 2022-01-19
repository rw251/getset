const compression = require('compression');
const express = require('express');
const path = require('path');
const forceSsl = require('express-force-ssl');
const pino = require('pino')();
const expressPino = require('express-pino-logger');
const passport = require('passport');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const Rollbar = require('rollbar');
const CONFIG = require('./config');
const mongoose = require('mongoose');
const http = require('http');
const initializeRoutes = require('./routes');

const rollbar = new Rollbar({
  accessToken: CONFIG.rollbarServerToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const DEBUG = true;

const app = express();
app.use(compression()); // enable gzip compression

mongoose.set('debug', DEBUG);
mongoose.Promise = global.Promise;
mongoose.connect(CONFIG.mongoUrl, { useMongoClient: true });
mongoose.connection.on('error', (err) => {
  pino.error(err);
  pino.info('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

const port = CONFIG.server.port || '8228';
app.set('port', port);

if (process.env.NODE_ENV === 'production') {
  console.log('ATTEMPTING FORCESSL');
  app.use(forceSsl);
}

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(expressPino({ logger: pino }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: CONFIG.passport.secret,
    store: MongoStore.create({ mongoUrl: CONFIG.mongoUrl }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// For IE need to specify this
app.use((req, res, next) => {
  res.set('Cache-control', 'no-cache');
  res.set('Expires', '-1');
  return next();
});

// So that on heroku it recognises requests as https rather than http
app.enable('trust proxy');

// Ensure 301 redirects added to requests to herokuapp.com requests
app.use((req, res, next) => {
  const host = req.get('Host');
  if (host === 'getset.herokuapp.com') {
    // Special logic if it is the service worker request
    return req.originalUrl === '/sw.js'
      ? res.sendFile(path.join(__dirname, '..', '..', 'dist', 'sw-self-destruct.js'))
      : res.redirect(301, `https://getset.ga${req.originalUrl}`);
  }
  return next();
});

initializeRoutes(app);

app.use(express.static(path.join(__dirname, '..', '..', 'dist')));

// catch 404 and respond accordingly
app.use((req, res) => {
  pino.info('A 404 request');
  pino.info(req.headers);
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    // if a html request then treat the url as a client side route
    // and we return the main index.html page which will then do
    // the client side routing
    return res.status(200).sendFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  // respond with json
  if (req.accepts('json')) {
    return res.send({ error: 'Not found' });
  }

  // default to plain-text. send()
  return res.type('txt').send('Not found');
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

// Use the rollbar error handler to send exceptions to your rollbar account
app.use(rollbar.errorHandler());

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
      pino.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      pino.error(`${bind} is already in use`);
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
  pino.info('listening');
};

pino.info(`Starting on port ${port}`);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
