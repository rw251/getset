import page from 'page';
import home from '../controllers/home';
import create from '../controllers/create';
import validate from '../controllers/validate';
import convert from '../controllers/convert';
import search from '../controllers/search';
import enhance from '../controllers/enhance';
import login from '../controllers/login';

const updateSelectedTab = (ctx, next) => {
  $('.navbar-nav li').removeClass('active');
  $(`.navbar-nav li a[href="${ctx.pathname}"]`).parent().addClass('active');
  next();
};

page('/', updateSelectedTab, home);
page('/login', updateSelectedTab, login);
page('/create', updateSelectedTab, create);
page('/convert', updateSelectedTab, convert);
page('/validate', updateSelectedTab, validate);
page('/search', updateSelectedTab, search);
page('/enhance', updateSelectedTab, enhance);

export { page as default };