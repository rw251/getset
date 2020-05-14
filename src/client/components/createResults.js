import emptyTable from './mixins/empty-table';

export default ({ selected, numMatched, numUnmatched, excluded, user, githubSet, isDirty }) => `
<div class="scrollable-parent">
  <ul class="nav nav-tabs" role="tablist">
    <li class="${!selected || selected === 'matchedTabContent' ? 'active' : ''}" role="presentation">
      <a href="#matchedTabContent" aria-controls="matchedTabContent" role="tab" data-toggle="tab">${`Matching codes (${numMatched})`}</a>
    </li>
    <li role="presentation">
      <a href="#matchedDescendantButNotMatchedTabContent" aria-controls="matchedDescendantButNotMatchedTabContent" role="tab" data-toggle="tab">${`Unmatched descendants (${numUnmatched})`}</a>
    </li>
    <li role="presentation">
      <a href="#excludedTabContent" aria-controls="excludedTabContent" role="tab" data-toggle="tab">${`Excluded (${excluded.length})`}</a>
    </li>
    <li role="presentation" style="float:right;line-height:45px;">
      <div class="btn-toolbar">
        ${!user || !user.profile
    ? `
        <a class="btn btn-github btn-social" href="/auth/github?returnTo=/create">
          <i class="fab fa-github"></i>Sign in with GitHub to save
        </a>`
    : `${
      githubSet && !isDirty
        ? `<span class="pull-left" id="savedToGithub">
          Saved as: <a href="${githubSet.repoUrl}" target="_blank">${githubSet.name.substr(0, 20)}...</a>
        </span>`
        : `${
          isDirty
            ? '<button class="btn btn-warning" id="updateGit" type="button" data-toggle="modal" data-target="#saveModal">Save changes</button>'
            : '<button class="btn btn-warning" id="saveToGit" type="button" data-toggle="modal" data-target="#saveModal">Save to GitHub</button>'
        }`
    }`}
        <div class="btn-group">
          <button class="btn btn-success" id="downloadCodeSet">Download code set</button>
          <button class="btn btn-success dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button>
          <ul class="dropdown-menu dropdown-menu-right">
            <li id="downloadCodes"><a href="#">Download codes</a></li>
            <li id="downloadCodesWithDefinitions"><a href="#">Download codes with definitions</a></li>
            <li id="downloadMeta"><a href="#">Download meta</a></li>
            <li class="divider" role="separator"></li>
            <li id="downloadAll"><a href="#">Download all</a></li>
          </ul>
        </div>
      </div>
    </li>
  </ul>
  <div class="tab-content">
    <div class="tab-pane active in" id="matchedTabContent" role="tabpanel" style="margin-bottom:20px;">${emptyTable('matchedTabContent')}</div>
    <div class="tab-pane" id="matchedDescendantButNotMatchedTabContent" role="tabpanel" style="margin-bottom:20px;">${emptyTable('matchedDescendantButNotMatchedTabContent')}</div>
    <div class="tab-pane" id="excludedTabContent" role="tabpanel" style="margin-bottom:20px;">${emptyTable('excludedTabContent')}</div>
  </div>
</div>
<div class="modal fade" id="saveModal" tabindex="-1" role="dialog" aria-labelledby="saveModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form action="">
        <div class="modal-header">
          <button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
          <h4 class="modal-title" id="saveModalLabel">Save code set ${githubSet ? 'changes ' : ''}to GitHub</h4>
        </div>
        <div class="modal-body">
          <p>This allows you to publish and share your code sets with other researchers</p>
          <div class="form-group">
            <label for="name">Name</label>
            ${githubSet
    ? `<input class="form-control" id="firstInput" type="text" value="${githubSet.name.split(' | ')[0]}" name="name" readonly/>`
    : '<input class="form-control" id="firstInput" type="text" placeholder="A name for your code set - try to make it descriptive!" name="name" />'}
            
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea class="form-control" rows="3" placeholder="Tell us a bit more about what the code set is." name="description">${githubSet ? githubSet.description : ''}</textarea>
          </div>
          ${githubSet
    ? `
            <div class="form-group">
              <label for="message">What's changed?</label>
              <textarea class="form-control" rows="3" placeholder="Tell us a bit more about what changes you've made and why" name="message"></textarea>
            </div>`
    : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-default hide-on-submit" type="button" data-dismiss="modal">Cancel</button>
          <button class="btn btn-primary hide-on-submit" type="submit">Save to GitHub</button>
          <button class="btn btn-primary disabled" id="loader" type="button" style="display:none;"><i class="fa fa-sync-alt fa-spin fa-fw"></i></button>
        </div>
      </form>
    </div>
  </div>
</div>`;

// .scrollable-parent
//   // Nav tabs
//   ul.nav.nav-tabs(role='tablist')
//     li(class=!selected || selected==='matchedTabContent' ? 'active' : '', role='presentation')
//       a(href='#matchedTabContent', aria-controls='matchedTabContent', role='tab', data-toggle='tab')= 'Matching codes (' + numMatched + ')'
//     li(class=selected==='matchedDescendantButNotMatchedTabContent' ? 'active' : '', role='presentation')
//       a(href='#matchedDescendantButNotMatchedTabContent', aria-controls='matchedDescendantButNotMatchedTabContent', role='tab', data-toggle='tab')= 'Unmatched descendants (' + numUnmatched + ')'
//     li(class=selected==='excludedTabContent' ? 'active' : '', role='presentation')
//       a(href='#excludedTabContent', aria-controls='excludedTabContent', role='tab', data-toggle='tab')= 'Excluded (' + excluded.length + ')'
//     li(role='presentation',style="float:right;line-height:45px;")
//       .btn-toolbar
//         if !user || !user.name
//           a.btn.btn-github.btn-social(href='/auth/github?returnTo=/create')
//             i.fa.fa-github
//             | Sign in with GitHub to save
//         else
//           if githubSet && !isDirty
//             span#savedToGithub.pull-left
//               | Saved as:
//               a(href=githubSet.repoUrl, target="_blank")= `${ githubSet.name.substr(0, 20) }...`
//           else if isDirty
//             button#updateGit.btn.btn-warning(type="button", data-toggle="modal", data-target="#saveModal") Save
//           else
//             button.btn.btn-warning#saveToGit(type="button", data-toggle="modal", data-target="#saveModal") Save to GitHub
//         .btn-group
//           button#downloadCodeSet.btn.btn-success Download code set
//           button.btn.btn-success.dropdown-toggle(type='button', data-toggle='dropdown', aria-haspopup='true', aria-expanded='false')
//             span.caret
//             span.sr-only Toggle Dropdown
//           ul.dropdown-menu
//             li#downloadCodes
//               a(href='#') Download codes
//             li#downloadMeta
//               a(href='#') Download meta
//             li.divider(role='separator')
//             li#downloadAll
//               a(href='#') Download all

//   // Tab panes
//   .tab-content
//     #matchedTabContent.tab-pane(class=!selected || selected==='matchedTabContent' ? 'active in' : '', role='tabpanel',style='margin-bottom:20px')
//       +emptyTable('matchedTabContent')
//     #matchedDescendantButNotMatchedTabContent.tab-pane(class=selected==='matchedDescendantButNotMatchedTabContent' ? 'active in' : '', role='tabpanel',style='margin-bottom:20px')
//       +emptyTable('matchedDescendantButNotMatchedTabContent')
//     #excludedTabContent.tab-pane(class=selected==='excludedTabContent' ? 'active in' : '', role='tabpanel',style='margin-bottom:20px')
//       +emptyTable('excludedTabContent')
// // Modal
// #saveModal.modal.fade(tabindex='-1', role='dialog', aria-labelledby='saveModalLabel')
//   .modal-dialog(role='document')
//     .modal-content
//       form(action="")
//         .modal-header
//           button.close(type='button', data-dismiss='modal', aria-label='Close')
//             span(aria-hidden='true') ×
//           h4#saveModalLabel.modal-title= `Save code set ${ githubSet ? 'changes ' : '' } to GitHub`
//         .modal-body
//           p This allows you to publish and share your code sets with other researchers
//           if githubSet
//             .form-group
//               label(for='name') Name
//               input#firstInput.form-control(type='text', name='name', value=githubSet.name.split(' | ')[0], readonly)
//           else
//             .form-group
//               label(for='name') Name
//               input#firstInput.form-control(type='text',placeholder='A name for your code set - try to make it descriptive!', name='name')
//           .form-group
//             label(for='description') Description
//             textarea.form-control(rows='3',placeholder='Tell us a bit more about what the code set is.', name='description')
//               = githubSet ? githubSet.description : ''
//           if githubSet
//             .form-group
//               label(for='message') What's changed?
//               textarea.form-control(rows='3',placeholder='Tell us a bit more about what changes you\'ve made and why', name='message')
//         .modal-footer
//           button.btn.btn-default.hide-on-submit(type='button', data-dismiss='modal') Cancel
//           button.btn.btn-primary.hide-on-submit(type='submit') Save to GitHub
//           button.btn.btn-primary.disabled#loader(type='button',style='display:none')
//             i.fa.fa-refresh.fa-spin.fa-fw
