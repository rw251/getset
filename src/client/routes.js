import home from './controllers/homeController';
import create from './controllers/createController';
// import validate from '../controllers/validate';
// import convert from '../controllers/convert';
// import search from '../controllers/search';
// import enhance from '../controllers/enhance';
// import account from '../controllers/account';
// import login from '../controllers/login';

// const updateSelectedTab = (ctx, next) => {
//   // $('.navbar-nav li').removeClass('active');
//   // $(`.navbar-nav li a[href="${ctx.pathname}"]`).parent().addClass('active');
//   next();
// };

export default [
  { controller: home, regex: /''/, isDefault: true },
  { controller: create, regex: /^create/ },
  // { controller: home, regex: /''/, isDefault: true },
];
