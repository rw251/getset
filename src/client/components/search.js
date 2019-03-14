export default ({ user }) => `
${!user || !user.profile
    ? `
    <div class="container">
      <h1>Search</h1>
      <p>
        Search for other code sets. You can
        <ul>
          <li>Discover new code sets from other researchers</li>
          <li>Make alterations and save new versions - but keeping links back to the original</li>
          <li>Compare different code sets to spot differences</li>
        </ul>However for all of this you need to..
      </p>
      <p><a class="btn btn-github btn-social" href="/auth/github?returnTo=/search"><i class="fab fa-github"></i>sign in with GitHub </a></p>
      <p>..to see more.</p>
    </div>`
    : `
    <div class="container-fluid scrollable-parent">
      <div class="row scrollable-parent">
        <div class="scrollable-parent" id="results"></div>
      </div>
    </div>`
}`;

// if !user || !user.name
//   .container
//     h1 Search
//     p
//       | Search for other code sets. You can
//       ul
//         li Discover new code sets from other researchers
//         li Make alterations and save new versions - but keeping links back to the original
//         li Compare different code sets to spot differences
//       | However for all of this you need to..
//     p
//       a.btn.btn-github.btn-social(href='/auth/github?returnTo=/search')
//         i.fa.fa-github
//         | sign in with GitHub
//     p ..to see more.
// else
//   .container-fluid.scrollable-parent
//     .row.scrollable-parent
//       #results.scrollable-parent
