import { updateActive, updateBreadcrumbs } from './common';

import homePageComponent from '../components/home';
import defaultController from './defaultController';

import { displayLoaderSync } from '../loader';

export default (callback) => {
  displayLoaderSync(() => {
    // hideLogin();

    updateActive('tab-help');
    updateBreadcrumbs([{ label: 'Contact / Help' }]);

    document.getElementById('mainContent').innerHTML = homePageComponent();
    //homePage();

    if (callback) callback();
  });
};
