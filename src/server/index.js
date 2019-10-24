const compression = require('compression');
const express = require('express');
const path = require('path');
const forceSsl = require('express-force-ssl');
const pino = require('pino')();
const expressPino = require('express-pino-logger');
const bodyParser = require('body-parser');
const passport = require('passport');
const expressSession = require('express-session');
const flash = require('express-flash');
const Rollbar = require('rollbar');
const CONFIG = require('./config');
const mongoose = require('mongoose');
const http = require('http');
const initializeRoutes = require('./routes');

const rollbar = new Rollbar({
  accessToken: CONFIG.rollbar.postServerToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const DEBUG = true;

const app = express();
app.use(compression()); // enable gzip compression

mongoose.set('debug', DEBUG);
mongoose.Promise = global.Promise;
mongoose.connect(CONFIG.mongoUrl, { useMongoClient: true });
// add connection to other terminologies if they exist
if (CONFIG.MONGO_URL_EMIS) mongoose.createConnection(CONFIG.MONGO_URL_EMIS);
mongoose.connection.on('error', (err) => {
  pino.error(err);
  pino.info('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

const port = CONFIG.server.port || '8228';
app.set('port', port);
// app.use(expressStatusMonitor());
// app.use(compression());

if (process.env.NODE_ENV === 'production') {
  console.log('ATTEMPTING FORCESSL');
  app.use(forceSsl);
}


// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(expressPino({ logger: pino }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: CONFIG.passport.secret,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

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

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
