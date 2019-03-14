import codeTable from './mixins/code-table';
import codeTableOfGraph from './mixins/code-table-of-graph';
import codeParentTable from './mixins/code-parent-table';
import codeMissingTable from './mixins/code-missing-table';
import perfStamp from './mixins/perf-stamp';


export default ({
  stamps,
  inCodeSetNotInTerminology,
  notInCodeSetDescendantOfCodeSet,
  numUnmatchedCodesOriginal,
  inCodeSetAndUnmatched,
  matchedDescendantButNotMatched,
  notInCodeSetButMatched,
  numInCodeSetAndUnmatched,
  numMatchedDescendantButNotMatched,
  numNotInCodeSetButMatched,
  excluded,
}) => `
<div class="scrollable-parent" style="display: flex;flex-direction: column;">
  <div class="token-container">
    ${stamps.map(stamp => perfStamp(stamp.title, stamp.perf, stamp.status, stamp.id)).join('')}
  </div>
  <div class="scrollable" id="resultTables" style="flex:1 1 auto;">
    ${(inCodeSetNotInTerminology && inCodeSetNotInTerminology.length > 0) ? `
      <div class="row">
        <div class="col-xs-12">
          <div class="panel panel-default" id="unfoundPanel">
            <div class="panel-heading">${`Unfound codes (${inCodeSetNotInTerminology.length})`}</div>
            <div class="panel-body">The following codes in your set do not appear in the selected terminology:</div>
            ${codeMissingTable(inCodeSetNotInTerminology)}
          </div>
        </div>
      </div>
      ` : ''}
    ${(notInCodeSetDescendantOfCodeSet && notInCodeSetDescendantOfCodeSet.length > 0 && numUnmatchedCodesOriginal > 0) ? `
      <div class="row">
        <div class="col-xs-12">
          <div class="panel panel-default" id="unmatchedChildrenPanel">
            <div class="panel-heading">${`Missing codes (${numUnmatchedCodesOriginal})`}</div>
            <div class="panel-body">The following codes are not in your set but they are descendants of codes that are.</div>
            ${codeParentTable(notInCodeSetDescendantOfCodeSet)}
          </div>
        </div>
      </div>
      ` : ''}
    ${(inCodeSetAndUnmatched && inCodeSetAndUnmatched.length > 0) ? `
      <div class="row">
        <div class="col-xs-12">
          <div class="panel panel-default" id="unmatchedCodesPanel">
            <div class="panel-heading">${`Unmatched codes (${numInCodeSetAndUnmatched})`}</div>
            <div class="panel-body">The following codes are in your set but they are not yet matched by a synonym.</div>
            ${codeTableOfGraph(inCodeSetAndUnmatched)}
          </div>
        </div>
      </div>
      ` : ''}
    ${(matchedDescendantButNotMatched && matchedDescendantButNotMatched.length > 0) ? `
      <div class="row">
        <div class="col-xs-12">
          <div class="panel panel-default" id="matchedDescendantButNotMatchedPanel">
            <div class="panel-heading">${`Unmatched descendants (${numMatchedDescendantButNotMatched})`}</div>
            <div class="panel-body">The following codes not matched by a synonym, but have an ancestor that is.</div>
            ${codeTableOfGraph(matchedDescendantButNotMatched)}
          </div>
        </div>
      </div>
      ` : ''}
    ${(notInCodeSetButMatched && notInCodeSetButMatched.length > 0) ? `
      <div class="row">
        <div class="col-xs-12">
          <div class="panel panel-default" id="notInCodeSetButMatchedPanel">
            <div class="panel-heading">${`Matched - not in code set (${numNotInCodeSetButMatched})`}</div>
            <div class="panel-body">The following codes are matched by a synonym, but are not in your code set.</div>
            ${codeTableOfGraph(notInCodeSetButMatched)}
          </div>
        </div>
      </div>
      ` : ''}
    ${(excluded && excluded.length > 0) ? `
      <div class="row" style="margin-bottom:20px;">
        <div class="col-xs-12">
          <div class="panel panel-default" id="excludedPanel">
            <div class="panel-heading">${`Excluded (${excluded.length})`}</div>
            <div class="panel-body">The following codes are excluded based on your exclusion terms.</div>
            ${codeTable(excluded)}
          </div>
        </div>
      </div>
      ` : ''}
  </div>
</div>
  `;

// include ./mixins/code-table.jade
// include ./mixins/code-table-of-graph.jade
// include ./mixins/code-parent-table.jade
// include ./mixins/code-missing-table.jade
// include ./mixins/code-freq-table.jade
// include ./mixins/perf-stamp.jade

// .scrollable-parent(style="display: flex;flex-direction: column;")
//   .token-container
//     - each stamp in stamps
//       +perfStamp(stamp.title, stamp.perf, stamp.status, stamp.id)
//   #resultTables.scrollable(style="flex:1 1 auto")
//     - if(inCodeSetNotInTerminology && inCodeSetNotInTerminology.length > 0)
//       .row
//         .col-xs-12
//           #unfoundPanel.panel.panel-default
//             .panel-heading= 'Unfound codes (' + inCodeSetNotInTerminology.length + ')'
//             .panel-body The following codes in your set do not appear in the selected terminology:
//             +codeMissingTable(inCodeSetNotInTerminology)
//     - if(notInCodeSetDescendantOfCodeSet && notInCodeSetDescendantOfCodeSet.length > 0 && numUnmatchedCodesOriginal > 0)
//       .row
//         .col-xs-12
//           #unmatchedChildrenPanel.panel.panel-default
//             .panel-heading= 'Missing codes (' + numUnmatchedCodesOriginal + ')'
//             .panel-body The following codes are not in your set but they are descendants of codes that are.
//             +codeParentTable(notInCodeSetDescendantOfCodeSet)
//     - if(inCodeSetAndUnmatched && inCodeSetAndUnmatched.length > 0)
//       .row
//         .col-xs-12
//           #unmatchedCodesPanel.panel.panel-default
//             .panel-heading= 'Unmatched codes (' + numInCodeSetAndUnmatched + ')'
//             .panel-body The following codes are in your set but they are not yet matched by a synonym.
//             +codeTableOfGraph(inCodeSetAndUnmatched)
//     - if(matchedDescendantButNotMatched && matchedDescendantButNotMatched.length > 0)
//       .row
//         .col-xs-12
//           #matchedDescendantButNotMatchedPanel.panel.panel-default
//             .panel-heading= 'Unmatched descendants (' + numMatchedDescendantButNotMatched + ')'
//             .panel-body The following codes not matched by a synonym, but have an ancestor that is.
//             +codeTableOfGraph(matchedDescendantButNotMatched)
//     - if(notInCodeSetButMatched && notInCodeSetButMatched.length > 0)
//       .row
//         .col-xs-12
//           #notInCodeSetButMatchedPanel.panel.panel-default
//             .panel-heading= 'Matched - not in code set (' + numNotInCodeSetButMatched + ')'
//             .panel-body The following codes are matched by a synonym, but are not in your code set.
//             +codeTableOfGraph(notInCodeSetButMatched)
//     - if(excluded && excluded.length > 0)
//       .row(style="margin-bottom:20px")
//         .col-xs-12
//           #excludedPanel.panel.panel-default
//             .panel-heading= 'Excluded (' + excluded.length + ')'
//             .panel-body The following codes are excluded based on your exclusion terms.
//             +codeTable(excluded)
