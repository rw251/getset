import terminologySelect from './partials/terminologySelect';

export default ({ loading, terminologies }) => `
  ${
    !loading
      ? ''
      : `
    <div class="loading-overlay">
      <div class="loading-content"><i class="fa fa-sync-alt fa-spin fa-fw"> </i>Loading...</div>
    </div>`
  }
    <div class="container-fluid scrollable-parent">
    <div class="row scrollable-parent">
      <div class="col-lg-4 col-md-3 scrollable" style="padding-bottom:25px;">
        <h1>Create</h1>
        <form id="createForm">
          ${terminologySelect(terminologies)}
          <div class="row">
            <div class="col-lg-6">
              <button class="btn btn-danger btn-remove-all" data-which="inclusion">X Remove all terms</button>
              <div class="form-group">
                <label for="synonym">Search term</label>
                <div class="input-group">
                  <input class="form-control" id="synonym" type="text" placeholder="Enter synonyms here..." autocomplete="off" /><span class="input-group-btn">
                    <button class="btn btn-default" id="addSynonym" type="button">Add!</button></span>
                </div>
              </div>
              <div id="synonymList"></div>
            </div>
            <div class="col-lg-6">
              <div class="form-group">
                <button class="btn btn-danger btn-remove-all" data-which="exclusion">X Remove all terms</button>
                <label for="exclusion">Exclusion term</label>
                <div class="input-group">
                  <input class="form-control" id="exclusion" type="text" placeholder="Enter exclusion synonyms here..." autocomplete="off" /><span class="input-group-btn">
                    <button class="btn btn-default" id="addExclusion" type="button">Add!</button></span>
                </div>
              </div>
              <div id="exclusionList"></div>
            </div>
          </div>
        </form>
        <p id="status"></p>
      </div>
      <div class="col-lg-8 col-md-9 scrollable-parent" id="results">
        <div class="result-placeholder" style="height: 350px;text-align:center;border: 1px dashed gray;background-color: lightgray;padding-top:100px;"><span style="font-size:20px;">Results will go here</span></div>
      </div>
    </div>
  </div>
`;

// if loading
//   .loading-overlay
//     .loading-content
//       i.fa.fa-refresh.fa-spin.fa-fw
//       | Loading...
// .container-fluid.scrollable-parent
//   .row.scrollable-parent
//     .col-lg-4.col-md-3.scrollable(style="padding-bottom:25px")
//       h1 Create
//       form#createForm
//         .form-group
//           label.radio-inline
//             input(type="radio", name="terminology", id="terminology1", value="Readv2", checked='true')
//             | Read v2
//           label.radio-inline
//             input(type="radio", name="terminology", id="terminology2", value="SNOMED CT")
//             | SNOMED CT
//         .row
//           .col-lg-6
//             button.btn.btn-danger.btn-remove-all(data-which='inclusion') X Remove all terms
//             .form-group
//               label(for='synonym') Search term
//               .input-group
//                 input#synonym.form-control(type='text',placeholder='Enter synonyms here...',autocomplete='off')
//                 span.input-group-btn
//                   button#addSynonym.btn.btn-default(type="button") Add!
//             #synonymList
//           .col-lg-6
//             .form-group
//               button.btn.btn-danger.btn-remove-all(data-which='exclusion') X Remove all terms
//               label(for='exclusion') Exclusion term
//               .input-group
//                 input#exclusion.form-control(type='text',placeholder='Enter exclusion synonyms here...',autocomplete='off')
//                 span.input-group-btn
//                   button#addExclusion.btn.btn-default(type="button") Add!
//             #exclusionList
//       p#status
//     #results.col-lg-8.col-md-9.scrollable-parent
//       .result-placeholder(style="height: 350px;text-align:center;border: 1px dashed gray;background-color: lightgray;padding-top:100px")
//         span(style="font-size:20px") Results will go here
