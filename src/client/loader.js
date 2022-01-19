import { Progress } from 'rw-progress';
import { showAlert } from './controllers/common';
import 'rw-progress/style.scss';

let latestPageRequestId;

/**
 * Helper function that displays and hides the loading indicator
 *
 * @param {Promise} whileDoingThis A promise of all the data required to render the view
 * @param {Function} thenDoThis A function taking a data object as it's
 * first parameter, called when the initial promise resolves
 *
 * @returns {Promise}
 */
const displayLoader = (whileDoingThis, thenDoThis) => {
  // Show progress indicator
  Progress.start();

  // So we know whether this is still the most recent page
  // requested by the user.
  const localPageRequestId = Math.random();
  latestPageRequestId = localPageRequestId;

  // Call the first promise to typically fetch some data
  return whileDoingThis
    .then((data) => {
      if (latestPageRequestId === localPageRequestId) {
        // If it's still the most recently requested page then hide the loading
        // and wire up the page via the other promise
        Progress.done();
        thenDoThis(data);
      }
    })
    .catch((err) => {
      if (err.message === 'Not logged in') {
        throw err; // so the standard error handling causes the callback to run
      }
      if (latestPageRequestId === localPageRequestId) {
        // If it's still the most recently requested page then hide the loading
        // and notify the user of the error
        Progress.done();
        showAlert(
          "Something's not working correctly. You could try refreshing the page. Otherwise please drop the support team a line.",
          'warning'
        );
        console.log(err);
        throw err;
      }
      // do nothing as the user has tried to move on before the page with the error returned
    });
};

/**
 * For when you can display a page without fetching anything in advance
 *
 * @param {Function} doThis Function to execute to setup page
 */
const displayLoaderSync = (doThis) => {
  // Still need to hide the progress bar if showing and
  // change the id of the latest page request
  latestPageRequestId = Math.random();
  Progress.done();
  doThis();
};

export { displayLoader, displayLoaderSync };
