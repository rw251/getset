import api from '../api';
import alertComponent from '../components/alert';
import messageComponent from '../components/message';
import breadcrumbComponent from '../components/breadcrumbs';

const loginStatus = 'status';

const updateBreadcrumbs = (crumbs) => {
  const html = breadcrumbComponent(crumbs);
  // document.getElementById('breadcrumbs').innerHTML = html;
};

const updateActive = (id) => {
  const activeLinks = document.querySelector('li.active');
  if (activeLinks) activeLinks.classList.remove('active');

  const activeLink = document.querySelector(`#${id}`);
  if (activeLink) activeLink.classList.add('active');
};

const showAlert = (message, type) => {
  const messageContainer = document.getElementById('message');
  if (messageContainer) {
    messageContainer.innerHTML = alertComponent(message, type);
  }
};

const hideAlert = () => {
  const messageContainer = document.getElementById('message');
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }
};

const showMessage = (title, message, buttonLink, buttonText) =>
  messageComponent(title, message, buttonLink, buttonText);

// const updateUserDropdown = () => {
//   api
//     .getUser()
//     .then((user) => {
//       if (user && user.name) {
//         const userMenuHtml = userMenuComponent(user.name, user.roles.includes('admin'));
//         document.getElementById('userDropdown').innerHTML = userMenuHtml;
//         document.getElementById('userDropdown').style.display = 'block';
//         document.getElementById('logout-button').onclick = () => {
//           resetLoginSession();
//         };
//       } else {
//         document.getElementById('userDropdown').style.display = 'none';
//       }
//     })
//     .catch(() => {
//       document.getElementById('userDropdown').style.display = 'none';
//     });
// };

// const showLogin = () => {
//   resetLoginSession();

//   document.getElementById('loginContent').style.display = 'block';
//   document.getElementById('mainContent').style.display = 'none';

//   updateUserDropdown();
// };

// const hideLogin = () => {
//   refreshLoginSession();

//   document.getElementById('loginContent').style.display = 'none';
//   document.getElementById('mainContent').style.display = 'block';

//   updateUserDropdown();
// };

// const resetLoginSession = () => {
//   sessionStorage.removeItem(loginStatus);
// };

// const refreshLoginSession = () => {
//   if (!sessionStorage.getItem(loginStatus)) {
//     sessionStorage.setItem(loginStatus, 'signedin');
//   }
// };

const getLoginSession = () => sessionStorage.getItem(loginStatus);

export {
  updateActive,
  updateBreadcrumbs,
  showAlert,
  hideAlert,
  // hideLogin,
  // showLogin,
  showMessage,
  getLoginSession,
};
