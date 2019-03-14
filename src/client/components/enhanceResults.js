import codeTable from './mixins/code-table';
import codeFrequencyTable from './mixins/code-freq-table';

export default ({ unfoundCodes, codeFrequency, codes }) => `
  ${unfoundCodes && unfoundCodes.length > 0
    ? `
  <div class="alert alert-danger alert-dismissible" role="alert">
    <button class="close" type="button" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">×</span>
    </button>
    <strong>Warning!</strong>
    ${` We couldn't find the following code${unfoundCodes.length > 1 ? 's' : ''}: ${unfoundCodes.join(', ')}`}
  </div>`
    : `
  <div class="alert alert-success alert-dismissible" role="alert">
    <button class="close" type="button" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">×</span></button>
    <strong>Success!</strong>
    We found all the codes in your set.
  </div>`}
  <div>
  <!-- Nav tabs-->
  <ul class="nav nav-tabs" role="tablist">
    <li class="${codeFrequency ? '' : 'active'}" role="presentation">
      <a href="#existingTabContent" aria-controls="existingTabContent" role="tab" data-toggle="tab">${`Existing code set (${codes.length})`}</a>
    </li>
    <li class="${codeFrequency ? 'active' : ''}" role="presentation">
      <a href="#frequencyTabContent" aria-controls="frequencyTabContent" role="tab" data-toggle="tab">Term frequency</a>
    </li>
    <li role="presentation">
      <a href="#matchedExistingTabContent" aria-controls="matchedExistingTabContent" role="tab" data-toggle="tab">Matched - in existing (0)</a>
    </li>
    <li role="presentation">
      <a href="#matchedNotExistingTabContent" aria-controls="matchedNotExistingTabContent" role="tab" data-toggle="tab">Matched - not in existing (0)</a>
    </li>
    <li role="presentation">
      <a href="#existingNotMatchedTabContent" aria-controls="existingNotMatchedTabContent" role="tab" data-toggle="tab">${`Existing - not matched (${codes.length})`}</a>
    </li>
    <li role="presentation">
      <a href="#excludedTabContent" aria-controls="excludedTabContent" role="tab" data-toggle="tab">Matched - excluded (0)</a>
    </li>
  </ul>
  <!-- Tab panes-->
  <div class="tab-content">
    <div class="tab-pane active in" id="existingTabContent" role="tabpanel">${codeTable(codes)}</div>
    <div class="tab-pane" id="frequencyTabContent" role="tabpanel">${codeFrequencyTable(codes)}</div>
    <div class="tab-pane" id="matchedExistingTabContent" role="tabpanel">${codeTable([])}</div>
    <div class="tab-pane" id="matchedNotExistingTabContent" role="tabpanel">${codeTable([])}</div>
    <div class="tab-pane" id="existingNotMatchedTabContent" role="tabpanel">${codeTable(codes)}</div>
    <div class="tab-pane" id="excludedTabContent" role="tabpanel">${codeTable([])}</div>
  </div>
</div>
`;

// include ./mixins/code-table.jade
// include ./mixins/code-freq-table.jade

// - if(unfoundCodes && unfoundCodes.length>0)
//   .alert.alert-danger.alert-dismissible(role='alert')
//     button.close(type='button', data-dismiss='alert', aria-label='Close')
//       span(aria-hidden='true') ×
//     strong Warning!
//     = ' We couldn\'t find the following code' + (unfoundCodes.length > 1 ? 's' : '') + ': ' + unfoundCodes.join(', ')
// - else
//   .alert.alert-success.alert-dismissible(role='alert')
//     button.close(type='button', data-dismiss='alert', aria-label='Close')
//       span(aria-hidden='true') ×
//     strong Success!
//     |  We found all the codes in your set.
// div
//   // Nav tabs
//   ul.nav.nav-tabs(role='tablist')
//     li(class=codeFrequency ? '' : 'active', role='presentation')
//       a(href='#existingTabContent', aria-controls='existingTabContent', role='tab', data-toggle='tab')= 'Existing code set (' + codes.length + ')'
//     li(class=codeFrequency ? 'active' : '', role='presentation')
//       a(href='#frequencyTabContent', aria-controls='frequencyTabContent', role='tab', data-toggle='tab') Term frequency
//     li(role='presentation')
//       a(href='#matchedExistingTabContent', aria-controls='matchedExistingTabContent', role='tab', data-toggle='tab') Matched - in existing (0)
//     li(role='presentation')
//       a(href='#matchedNotExistingTabContent', aria-controls='matchedNotExistingTabContent', role='tab', data-toggle='tab') Matched - not in existing (0)
//     li(role='presentation')
//       a(href='#existingNotMatchedTabContent', aria-controls='existingNotMatchedTabContent', role='tab', data-toggle='tab')= 'Existing - not matched (' + codes.length + ')'
//     li(role='presentation')
//       a(href='#excludedTabContent', aria-controls='excludedTabContent', role='tab', data-toggle='tab') Matched - excluded (0)

//   // Tab panes
//   .tab-content
//     #existingTabContent.tab-pane(class=codeFrequency ? '' : 'active in', role='tabpanel')
//       +codeTable(codes)
//     #frequencyTabContent.tab-pane(class=codeFrequency ? 'active in' : '', role='tabpanel')
//       +codeFrequencyTable(codes)
//     #matchedExistingTabContent.tab-pane(role='tabpanel')
//       +codeTable([])
//     #matchedNotExistingTabContent.tab-pane(role='tabpanel')
//       +codeTable([])
//     #existingNotMatchedTabContent.tab-pane(role='tabpanel')
//       +codeTable(codes)
//     #excludedTabContent.tab-pane(role='tabpanel')
//       +codeTable([])
