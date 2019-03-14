export default ({ user }) => `
  ${!user || !user.profile
    ? `
<div class="container">
  <h1>Enhance</h1>
  <p>
    Enhance existing code sets. You can
    <ul>
      <li>Copy/paste an existing code set to being to generate metadata for this tool</li>
      <li>Use advanced machine learning to automatically create the lists of inclusion and exclusion terms</li>
      <li>Highlight and correct deficiences in existing sets</li>
      <li>Update code sets to the latest version of your terminology</li>
      <li>Translate code sets between terminologies quickly and efficiently</li>
    </ul>However for all of this you need to..
  </p>
  <p><a class="btn btn-github btn-social" href="/auth/github?returnTo=/enhance"><i class="fab fa-github"></i>sign in with GitHub </a></p>
  <p>..to see more.</p>
</div>`
    : `
<div class="container-fluid scrollable-parent">
  <div class="row scrollable-parent">
    <div class="col-lg-4 col-md-3 scrollable" style="padding-bottom:25px;">
      <h1>Enhance</h1>
      <form id="enhanceForm">
        <div class="form-group">
          <label class="radio-inline">
            <input type="radio" name="terminology" id="terminology1" value="Readv2" checked="true" />Read v2
          </label>
          <label class="radio-inline">
            <input type="radio" name="terminology" id="terminology2" value="SNOMED CT" />SNOMED CT
          </label>
        </div>
        <div class="row">
          <div class="form-group">
            <label>Code set</label>
            <textarea class="form-control" id="codeSet" placeholder="Paste your existing code set here..."></textarea>
          </div>
        </div>
        <div class="row">
          <div class="form-group" id="separatorForm" style="display:none;">
            <label>Code set separator </label>
            <div class="btn-group" data-toggle="buttons">
              <label class="btn btn-default">
                <input id="sepComma" type="radio" name="separator" autocomplete="off" value="comma" /> ,
              </label>
              <label class="btn btn-default">
                <input id="sepNewLine" type="radio" name="separator" autocomplete="off" value="newline" /> \n
              </label>
              <label class="btn btn-default">
                <input id="sepTab" type="radio" name="separator" autocomplete="off" value="tab" /> \t
              </label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="form-group">
            <label for="synonym">Search term</label>
            <div class="input-group">
              <input class="form-control" id="synonym" type="text" placeholder="Enter synonyms here..." autocomplete="off" /><span class="input-group-btn">
                <button class="btn btn-default" id="addSynonym" type="button">Add!</button></span>
            </div>
          </div>
          <div id="synonymList"></div>
        </div>
        <div class="row">
          <div class="form-group">
            <label for="exclusion">Exclusion term</label>
            <div class="input-group">
              <input class="form-control" id="exclusion" type="text" placeholder="Enter exclusion synonyms here..." autocomplete="off" /><span class="input-group-btn">
                <button class="btn btn-default" id="addExclusion" type="button">Add!</button></span>
            </div>
          </div>
          <div id="exclusionList"></div>
        </div>
      </form>
    </div>
    <div class="col-lg-8 col-md-9 scrollable-parent" id="results">
      <div class="result-placeholder" style="height: 350px;text-align:center;border: 1px dashed gray;background-color: lightgray;padding-top:100px;"><span style="font-size:20px;">Results will go here</span></div>
    </div>
  </div>
</div>`}
`;

// if !user || !user.name
//   .container
//     h1 Enhance
//     p
//       | Enhance existing code sets. You can
//       ul
//         li Copy/paste an existing code set to being to generate metadata for this tool
//         li Use advanced machine learning to automatically create the lists of inclusion and exclusion terms
//         li Highlight and correct deficiences in existing sets
//         li Update code sets to the latest version of your terminology
//         li Translate code sets between terminologies quickly and efficiently
//       | However for all of this you need to..
//     p
//       a.btn.btn-github.btn-social(href='/auth/github?returnTo=/enhance')
//         i.fa.fa-github
//         | sign in with GitHub
//     p ..to see more.
// else
//   .container-fluid.scrollable-parent
//     .row.scrollable-parent
//       .col-lg-4.col-md-3.scrollable(style="padding-bottom:25px")
//         h1 Enhance
//         form#enhanceForm
//           .form-group
//             label.radio-inline
//               input(type="radio", name="terminology", id="terminology1", value="Readv2", checked='true')
//               | Read v2
//             label.radio-inline
//               input(type="radio", name="terminology", id="terminology2", value="SNOMED CT")
//               | SNOMED CT
//           .row
//             .form-group
//               label Code set
//               textarea#codeSet.form-control(placeholder='Paste your existing code set here...')
//           .row
//             .form-group#separatorForm(style="display:none")
//               label Code set separator
//               .btn-group(data-toggle='buttons')
//                 label.btn.btn-default
//                   input#sepComma(type='radio', name='separator', autocomplete='off', value='comma')
//                   |  ,
//                 label.btn.btn-default
//                   input#sepNewLine(type='radio', name='separator', autocomplete='off', value='newline')
//                   |  \n
//                 label.btn.btn-default
//                   input#sepTab(type='radio', name='separator', autocomplete='off', value='tab')
//                   |  \t
//           .row
//             .form-group
//               label(for='synonym') Search term
//               .input-group
//                 input#synonym.form-control(type='text',placeholder='Enter synonyms here...',autocomplete='off')
//                 span.input-group-btn
//                   button#addSynonym.btn.btn-default(type="button") Add!
//             #synonymList
//           .row
//             .form-group
//               label(for='exclusion') Exclusion term
//               .input-group
//                 input#exclusion.form-control(type='text',placeholder='Enter exclusion synonyms here...',autocomplete='off')
//                 span.input-group-btn
//                   button#addExclusion.btn.btn-default(type="button") Add!
//             #exclusionList
//       #results.col-lg-8.col-md-9.scrollable-parent
//         .result-placeholder(style="height: 350px;text-align:center;border: 1px dashed gray;background-color: lightgray;padding-top:100px")
//           span(style="font-size:20px") Results will go here
