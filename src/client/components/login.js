export default () => `
<div class="container">
  <div class="page-header">
    <h3>Sign in</h3>
  </div>
  <form class="form-horizontal" method="POST">
    <input type="hidden" name="_csrf" />
    <div class="form-group">
      <div class="col-sm-offset-3 col-sm-7"><a class="btn btn-block btn-github btn-social" href="/auth/github"><i class="fab fa-github"></i>Sign in with GitHub</a></div>
    </div>
  </form>
</div>
`;

// block content
//   .container
//     .page-header
//       h3 Sign in
//     form.form-horizontal(method='POST')
//       input(type='hidden', name='_csrf', value=_csrf)
//       .form-group
//         label.col-sm-3.control-label(for='email') Email
//         .col-sm-7
//           input.form-control(type='email', name='email', id='email', placeholder='Email', autofocus, required)
//       .form-group
//         label.col-sm-3.control-label(for='password') Password
//         .col-sm-7
//           input.form-control(type='password', name='password', id='password', placeholder='Password', required)
//       .form-group
//         .col-sm-offset-3.col-sm-7
//           button.col-sm-3.btn.btn-primary(type='submit')
//             i.fa.fa-user
//             | Login
//           a.btn.btn-link(href='/forgot') Forgot your password?
//       .form-group
//         .col-sm-offset-3.col-sm-7
//           hr
//       .form-group
//         .col-sm-offset-3.col-sm-7
//           a.btn.btn-block.btn-github.btn-social(href='/auth/github')
//             i.fa.fa-github
//             | Sign in with GitHub
