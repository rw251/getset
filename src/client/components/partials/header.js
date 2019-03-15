export default user => `
<div class="navbar navbar-default">
  <div class="navbar-header">
    <button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".navbar-collapse"><span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><a class="navbar-brand" href="/"><img src="/images/icon.svg" role="presentation" style="height:100%;display:inline;margin-right:5px;" /><span>GetSet</span></a>
  </div>
  <div class="collapse navbar-collapse">
    <ul class="nav navbar-nav">
      <li><a href="/">Home</a></li>
    </ul>
    <ul class="nav navbar-nav">
      <li><a href="/create">Create</a></li>
    </ul>
    <ul class="nav navbar-nav">
      <li><a href="/convert">Convert</a></li>
    </ul>
    <ul class="nav navbar-nav">
      <li><a href="/validate">Validate</a></li>
    </ul>
    <ul class="nav navbar-nav">
      <li><a href="/search">Search</a></li>
    </ul>
    <ul class="nav navbar-nav">
      <li><a href="/enhance">Enhance</a></li>
    </ul>
    <ul class="nav navbar-nav navbar-right">
    ${user && user.profile
    ? `
    <li class="dropdown">
      <a class="dropdown-toggle" href="#" data-toggle="dropdown">
        ${user.profile.picture
    ? `<img src="${user.profile.picture}" role="presentation" />`
    : ''}
        <span>${user.profile.name || user.email || user.id}</span>
        <i class="caret"></i>
      </a>
      <ul class="dropdown-menu">
        <li><a href="/account">My Account</a></li>
        <li class="divider"></li>
        <li><a href="/auth/logout">Logout</a></li>
      </ul>
    </li>`
    : '<li><a href="/login">Login</a></li>'}    
    </ul>
  </div>
</div>
`;
// .navbar.navbar-default
//   .navbar-header
//     button.navbar-toggle(type='button', data-toggle='collapse', data-target='.navbar-collapse')
//       span.sr-only Toggle navigation
//       span.icon-bar
//       span.icon-bar
//       span.icon-bar
//     a.navbar-brand(href='/')
//       img(src='/images/icon.svg', role='presentation', style='height:100%;display:inline;margin-right:5px')
//       span GetSet
//   .collapse.navbar-collapse
//     ul.nav.navbar-nav
//       li(class=(title == 'Home') ? 'active' : undefined)
//         a(href='/') Home
//     ul.nav.navbar-nav
//       li(class=(title == 'Create') ? 'active' : undefined)
//         a(href='/create') Create
//     ul.nav.navbar-nav
//       li(class=(title == 'Convert') ? 'active' : undefined)
//         a(href='/convert') Convert
//     ul.nav.navbar-nav
//       li(class=(title == 'Validate') ? 'active' : undefined)
//         a(href='/validate') Validate
//     ul.nav.navbar-nav
//       li(class=(title == 'Search') ? 'active' : undefined)
//         a(href='/search') Search
//     ul.nav.navbar-nav
//       li(class=(title == 'Enhance') ? 'active' : undefined)
//         a(href='/enhance') Enhance
//     ul.nav.navbar-nav.navbar-right
//       if !user
//         li(class=(title == 'Login') ? 'active' : undefined)
//           a(href='/login') Login
//       else
//         li.dropdown(class=(title == 'Account Management') ? 'active' : undefined)
//           a.dropdown-toggle(href='#', data-toggle='dropdown')
//             if user.profile.picture
//               img(src=user.profile.picture, role='presentation')
//             else
//               img(src=user.gravatar(60), role='presentation')
//             span= user.profile.name || user.email || user.id
//             i.caret
//           ul.dropdown-menu
//             li
//               a(href='/account') My Account
//             li.divider
//             li
//               a(href='/logout') Logout
//         input#userLoggedIn(type='hidden')
//         input#userName(type='hidden', value=user.profile.name || user.id)
//         input#userEmail(type='hidden', value=user.email)
