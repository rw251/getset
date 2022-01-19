import page from 'page';
import home from '../controllers/home';
import create from '../controllers/create';
import validate from '../controllers/validate';
import convert from '../controllers/convert';
import search from '../controllers/search';
import enhance from '../controllers/enhance';
import account from '../controllers/account';
import login from '../controllers/login';
import error from '../controllers/error';

const updateSelectedTab = (ctx, next) => {
  $('.navbar-nav li').removeClass('active');
  $(`.navbar-nav li a[href="${ctx.pathname}"]`).parent().addClass('active');
  next();
};

// const notFound = () => {
//   page('/');
// };

page('/', updateSelectedTab, home);
page('/login', updateSelectedTab, login);
page('/create', updateSelectedTab, create);
page('/convert', updateSelectedTab, convert);
page('/validate', updateSelectedTab, validate);
page('/search', updateSelectedTab, search);
page('/enhance', updateSelectedTab, enhance);
page('/account', updateSelectedTab, account);
page('/error', updateSelectedTab, error);
// page('*', notFound);

export { page as default };
