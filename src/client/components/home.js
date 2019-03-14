import title from './partials/title';

export default () => `
<div class="container">
  ${title()}
  <div class="row">
    <div class="col-sm-6">
      <h2>Create</h2>
      <p>Create a new set of clinical codes.</p>
      <p><a class="btn btn-default" href="/create" role="button">Go! »</a></p>
    </div>
    <div class="col-sm-6">
      <h2>Convert</h2>
      <p>Take your Readv2 code sets and converts them to SNOMED.</p>
      <p><a class="btn btn-default" href="/convert" role="button">Go! »</a></p>
    </div>
    <div class="col-sm-6">
      <h2>Validate</h2>
      <p>Validate an existing set of clinical codes.</p>
      <p><a class="btn btn-default" href="/validate" role="button">Go! »</a></p>
    </div>
    <div class="col-sm-6">
      <h2>Search</h2>
      <p>Search for clinical code sets.</p>
      <p><a class="btn btn-default" href="/search" role="button">Go! »</a></p>
    </div>
    <div class="col-sm-6">
      <h2>Enhance</h2>
      <p>Take an existing code set and retrospectively add metadata.</p>
      <p><a class="btn btn-default" href="/enhance" role="button">Go! »</a></p>
    </div>
  </div>
</div>
`;

// .container
//   include ./partials/title.jade

//   .row
//     .col-sm-6
//       h2 Create
//       p Create a new set of clinical codes.
//       p
//         a.btn.btn-default(href='/create', role='button') Go! »
//     .col-sm-6
//       h2 Convert
//       p Take your Readv2 code sets and converts them to SNOMED.
//       p
//         a.btn.btn-default(href='/convert', role='button') Go! »
//     .col-sm-6
//       h2 Validate
//       p Validate an existing set of clinical codes.
//       p
//         a.btn.btn-default(href='/validate', role='button') Go! »
//     .col-sm-6
//       h2 Search
//       p Search for clinical code sets.
//       p
//         a.btn.btn-default(href='/search', role='button') Go! »
//     .col-sm-6
//       h2 Enhance
//       p Take an existing code set and retrospectively add metadata.
//       p
//         a.btn.btn-default(href='/enhance', role='button') Go! »
