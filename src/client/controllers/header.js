import headerComponent from '../components/partials/header';
import state from '../state';

const $header = document.querySelector('header');

const wireUpGithubButton = () => {
  const githubButton = document.querySelector('.github-button');
  if (githubButton) {
    githubButton.addEventListener('click', () => {
      // IE loses the link navigation if this is done without the timeout
      setTimeout(() => {
        githubButton.parentElement.innerHTML =
          '<div class="lds-loader"><div></div><div></div><div></div></div>';
      }, 0);
    });
  }
};

const updateHeader = (user) => {
  const elapsed = new Date() - state.firstLoadTime;
  if (elapsed < 200 || elapsed > 2000) {
    // if really quick or really slow just show it straight away
    $header.innerHTML = headerComponent(user);
    wireUpGithubButton();
  } else {
    setTimeout(() => {
      console.log('Do html', user);
      $header.innerHTML = headerComponent(user);
      wireUpGithubButton();
    }, 2000 - elapsed);
  }
};

export { updateHeader };
