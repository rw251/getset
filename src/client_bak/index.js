import './scripts/jquery-global.js';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-social/bootstrap-social.css';
import 'clusterize.js/clusterize.css';

import state from './scripts/state';
import routes from './scripts/routes';
import api from './scripts/api';
import headerComponent from './components/partials/header';
import './styles.scss';

api.getUser().then((user) => {
  if (user) {
    state.isLoggedIn = true;
    state.user = user;
    document.querySelector('header').innerHTML = headerComponent(user);
  } else {
    state.isLoggedIn = false;
  }
});

$(document).ready(() => {
  routes.start();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => { console.log('main.js -> Service Worker Registered'); });
  }
});

