import errorComponent from '../components/error';
import defaultController from './default';
import state from '../scripts/state';

// params, state, url
export default function () {
  defaultController(errorComponent, state.error);
}
