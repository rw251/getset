import Router from 'rw-router';
import routes from './routes';
import state from './state';
import api from './api';
import { updateHeader } from './controllers/header';

import './styles.scss';

state.firstLoadTime = new Date();

api.getUser().then((user) => {
  updateHeader(user);

  state.isLoggedIn = !!user;
  state.user = user;
});

global.Router = Router;

// Initialize the router
Router.config(() => {
  // called everytime the user clicks a link
  state.initialPath = '';
});

// This script is only called on a server load so we might
// need to do some client routing

// First get the path
state.initialPath = window.location.pathname.replace(/^\/+|\/+$/g, '');

// Now look for a match in the routes
let controller = false;
let parameters = [null];
let defaultController;
routes.forEach((route) => {
  // Add all the routes to the Router
  Router.add(route.regex, route.controller);

  if (controller) return;
  if (route.isDefault) defaultController = route.controller;
  const result = state.initialPath.match(route.regex);
  if (result) {
    ({ controller } = route);
    parameters = result;
  }
});

// Start the router listening
Router.listen();

if (!controller) {
  // Shouldn't actually get here - but if we do
  // just load the homepage
  controller = defaultController;
}

const initialize = () => {
  parameters[0] = () => {};
  controller.apply({}, parameters);
};

if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
  // dom loaded so safe to call controller
  initialize();
} else {
  // dom not loaded so let's wait before firing the controller
  document.addEventListener('DOMContentLoaded', initialize);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('main.js -> Service Worker Registered');
  });
}
