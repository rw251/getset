import title from './partials/title';

export default () => `
<div class="container">
  ${title()}
  <div class="row">
    <div class="col-sm-6">
      <p style="font-size: 1.2em">Welcome to GetSet!</p>
      <p style="font-size: 1.2em">Here you will find a suite of tools for creating, searching, validating, and reusing clinical code sets.</p>
      <p style="font-size: 1.2em">For more information on why we built this tool please check out the following papers:</p>
      <p style="font-size: 1.2em">To get involved in the site's development, or to report bugs, please see the links in the footer below to the GitHub project and the issue tracker.</p>
      <ul>
        <li>
          Williams R, Brown B, Kontopantelis E, van Staa T, Peek N. 
          <strong>Term sets: A transparent and reproducible representation of clinical code sets. </strong>
          <i>PLOS One. </i>
          2019 Feb. Available from, DOI: 
          <a href="https://doi.org/10.1371/journal.pone.0212291" target="_blank" rel="noopener noreferrer">10.1371/journal.pone.0212291</a>
        </li>
        <li>
          Williams R, Kontopantelis E, Buchan I, Peek N. 
          <strong>Clinical code set engineering for reusing EHR data for research: A review. </strong>
          <i>Journal of Biomedical Informatics. </i>
          2017 Jun. Available from, DOI: 
          <a href="https://doi.org/10.1016/j.jbi.2017.04.010" target="_blank" rel="noopener noreferrer">10.1016/j.jbi.2017.04.010</a>
        </li>
      </ul>
      <p style="font-size: 0.8em">This site was developed by <a href="https://www.research.manchester.ac.uk/portal/richard.williams.html" target="_blank" rel="noopener noreferrer">Richard Williams</a> as part of the <a href="http://www.patientsafety.manchester.ac.uk/"  target="_blank" rel="noopener noreferrer">NIHR Greater Manchester Patient Safety Translational Research Centre (GM PSTRC)</a>.</p>
      <p style="font-size: 0.7em">This work was funded by the National Institute for Health Research (NIHR) Greater Manchester Patient Safety Translational Research Centre (NIHR Greater Manchester PSTRC). The views expressed are those of the authors and not necessarily those of the NHS, the NIHR or the Department of Health and Social Care.</p>
    </div>
    <div class="col-sm-6">
      <h3>I want to...</h3>
      <p><a style="text-align: left" class="btn btn-success btn-lg btn-block" href="/create" role="button"><i class="fas fa-arrow-right fa-fw"></i> Create a new clinical code set</a></p>
      <p><a style="text-align: left" class="btn btn-info btn-lg btn-block" href="/search" role="button"><i class="fas fa-search fa-fw"></i> Search for an existing code set</a></p>
      <h3>Coming Soon!</h3>
      <p><a style="text-align: left" class="btn btn-default btn-lg btn-block" href="/convert" role="button" disabled><i class="fas fa-exchange-alt fa-fw"></i> Translate a code set to a different terminology</a></p>
      <p><a style="text-align: left" class="btn btn-default btn-lg btn-block" href="/enhance" role="button" disabled><i class="fas fa-layer-group fa-fw"></i> Add metadata to an existing list of codes</a></p>
      <p><a style="text-align: left" class="btn btn-default btn-lg btn-block" href="/validate" role="button" disabled><i class="fas fa-glasses fa-fw"></i> Validate an existing code set</a></p>
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
