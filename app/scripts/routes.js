const page = require('page');
const home = require('../controllers/home');
const create = require('../controllers/create');
const validate = require('../controllers/validate');
const convert = require('../controllers/convert');
const search = require('../controllers/search');
const enhance = require('../controllers/enhance');
const login = require('../controllers/login');
const $ = require('jquery');

const updateSelectedTab = (ctx, next) => {
  $('.navbar-nav li').removeClass('active');
  $(`.navbar-nav li a[href="${ctx.pathname}"]`).parent().addClass('active');
  next();
};

page('/', updateSelectedTab, home);
page('/login', updateSelectedTab, login);
page('/create', updateSelectedTab, create.show);
page('/convert', updateSelectedTab, convert.show);
page('/validate', updateSelectedTab, validate.show);
page('/search', updateSelectedTab, search.show);
page('/enhance', updateSelectedTab, enhance.show);

module.exports = page;
