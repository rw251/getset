export default ({ user }) => `
<div class="container">
  <div class="page-header">
    <h3>Profile Information (retrieved from github)</h3>
  </div>
  <p>Email: ${user.email}</p>
  <p>Name: ${user.profile.name}</p>
  <div class="page-header">
    <h3>Delete Account</h3>
  </div>
  <form class="form-horizontal" action="/auth/account/delete" method="POST">
    <div class="form-group">
      <p class="col-sm-offset-3 col-sm-4">You can delete your account, but keep in mind this action is irreversible.</p>
      <input type="hidden" name="_csrf" value="_csrf" />
      <div class="col-sm-offset-3 col-sm-4">
        <button class="btn btn-danger" type="submit"><i class="fa fa-trash"></i>Delete my account</button>
      </div>
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
