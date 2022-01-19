import page from 'page';

import api from '../scripts/api';
import searchComponent from '../components/search';
import searchResultsComponent from '../components/searchResults';
import defaultController from './default';
import { momentFromNow } from '../scripts/utils';
import state from '../scripts/state';

const wireup = () => {
  $('#results').on('click', '.btn-delete', (evt) => {
    const $button = $(evt.currentTarget);
    const $row = $button.closest('tr');
    const $btnGroup = $button.closest('.btn-group');
    $btnGroup.replaceWith($('<span><i class="fa fa-trash fa-fw fa-spin fa-pulse"></i> Deleting..</span>'));
    const codeSetId = $button.data('id');
    api.deleteCodeSet(codeSetId)
      .then(() => {
        $row.fadeOut(1000, () => {
          $row.remove();
        });
      });
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-edit', (evt) => {
    const $button = $(evt.currentTarget);
    state.codeSetId = $button.data('id');
    delete state.currentSet;
    page('/create');
    // const $row = $button.closest('tr');
    // console.log(`editing...${$button.data('path')}`);
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-validate', (evt) => {
    // const $button = $(evt.currentTarget);
    // const $row = $button.closest('tr');
    // console.log(`validating...${$button.data('path')}`);
    evt.preventDefault();
  });
  $('#results').on('click', '.btn-download', (evt) => {
    // const $button = $(evt.currentTarget);
    // const $row = $button.closest('tr');
    // console.log(`downloading...${$button.data('path')}`);
    evt.preventDefault();
  });
  api.getCodeSets()
    .then((list) => {
      const localList = list.map((item) => {
        item.createdOn = momentFromNow(new Date(item.createdOn));
        item.lastUpdated = momentFromNow(new Date(item.lastUpdated));
        return item;
      });
      const html = searchResultsComponent({ list: localList, user: state.user });
      $('#results').html(html);
    });
};

const show = () => {
  defaultController(searchComponent);
  wireup();
};

export { show as default };
