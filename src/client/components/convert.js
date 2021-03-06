export default ({ user, count }) => `
<div class="container">
  <h1>Convert</h1>
  ${!user || !user.profile
    ? `<p>
  Convert your code sets to a different terminology
  <ul>
    <li>Upload a code set</li>
    <li>Select a new terminology</li>
    <li>Get help mapping</li>
  </ul>However for all of this you need to..
</p>
<p><a class="btn btn-github btn-social" href="/auth/github?returnTo=/convert"><i class="fab fa-github"></i>sign in with GitHub </a></p>
<p>..to see more.</p>`
    : `<form class="box" method="post" action="" enctype="multipart/form-data">
  <div class="box__input">
    <svg class="box__icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43">
      <path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"></path>
    </svg>
    <input class="box__file" id="file" type="file" name="files[]" data-multiple-caption="${count} files selected" multiple="" />
    <label for="file"><strong>Choose a file</strong><span class="box__dragndrop"> or drag it here</span>.</label>
    <button class="box__button" type="submit">Upload</button>
  </div>
  <div class="box__uploading">Uploading…</div>
  <div class="box__success">
    Done!<a class="box__restart" role="button"> Choose another file.</a><a class="edit-file" role="button"> Or edit this one...</a></div>
  <div class="box__error">Error! <span></span><a class="box__restart" role="button"> Try again!</a></div>
</form>
<form id="convertForm">
  <div class="form-group">
    <label class="radio-inline">
      <input type="radio" name="terminology" id="terminology1" value="Readv2" />Read v2
    </label>
    <label class="radio-inline">
      <input type="radio" name="terminology" id="terminology2" value="SNOMED CT" checked="true" />SNOMED CT
    </label>
  </div>
  <div class="row">
    <div class="col-lg-6">
      <div id="synonymList"></div>
    </div>
    <div class="col-lg-6">
      <div id="exclusionList"></div>
    </div>
  </div>
</form>
<p id="status"></p>`}
`;


// .container
//   h1 Convert
//   if !user || !user.name
//     p
//       | Convert your code sets to a different terminology
//       ul
//         li Upload a code set
//         li Select a new terminology
//         li Get help mapping
//       | However for all of this you need to..
//     p
//       a.btn.btn-github.btn-social(href='/auth/github?returnTo=/convert')
//         i.fa.fa-github
//         | sign in with GitHub
//     p ..to see more.
//   else
//     form.box(method='post', action='', enctype='multipart/form-data')
//       .box__input
//         svg.box__icon(xmlns="http://www.w3.org/2000/svg",width="50",height="43",viewBox="0 0 50 43")
//           path(d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z")
//         input#file.box__file(type='file', name='files[]', data-multiple-caption='{count} files selected', multiple='')
//         label(for='file')
//           strong Choose a file
//           span.box__dragndrop  or drag it here
//           | .
//         button.box__button(type='submit') Upload
//       .box__uploading Uploading…
//       .box__success
//         | Done!
//         a.box__restart(role="button")  Choose another file.
//         a.edit-file(role="button")  Or edit this one...
//       .box__error
//         | Error!
//         span
//         a.box__restart(role="button")  Try again!
//     form#convertForm
//       .form-group
//         label.radio-inline
//           input(type="radio", name="terminology", id="terminology1", value="Readv2")
//           | Read v2
//         label.radio-inline
//           input(type="radio", name="terminology", id="terminology2", value="SNOMED CT", checked='true')
//           | SNOMED CT
//       .row
//         .col-lg-6
//           #synonymList
//           //- .form-group
//           //-   label(for='synonym') Search term
//             //- .input-group
//             //-   input#synonym.form-control(type='text',placeholder='Enter synonyms here...',autocomplete='off')
//             //-   span.input-group-btn
//             //-     button#addSynonym.btn.btn-default(type="button") Add!
//         .col-lg-6
//           #exclusionList
//           //- .form-group
//           //-   label(for='exclusion') Exclusion term
//             //- .input-group
//             //-   input#exclusion.form-control(type='text',placeholder='Enter exclusion synonyms here...',autocomplete='off')
//             //-   span.input-group-btn
//             //-     button#addExclusion.btn.btn-default(type="button") Add!
//     p#status
