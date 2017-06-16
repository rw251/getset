const page = require('page');
const home = require('../controllers/home');
const create = require('../controllers/create');
const validate = require('../controllers/validate');
const search = require('../controllers/search');
const enhance = require('../controllers/enhance');
const login = require('../controllers/login');

page('/', home);
page('/login', login);
page('/create', create.show);
page('/validate', validate);
page('/search', search);
page('/enhance', enhance.show);

module.exports = page;
