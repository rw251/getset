export default (user, isInitialRender) => `
<nav>
  <input type="checkbox" id="nav-check">
  <div class="nav-header">
    <div class="nav-title" style="height:50px;font-size:20px">
      <img src="/images/icon.svg" role="presentation" style="height:100%;display:inline;margin-right:5px;vertical-align: middle">
      GetSet
    </div>
  </div>
  <div class="nav-btn">
    <label for="nav-check">
      <span></span>
      <span></span>
      <span></span>
    </label>
  </div>
  
  <div class="nav-links">
    <a href="javascript:void(0)" data-href="/">Home</a>
    <a href="javascript:void(0)" data-href="/create">Create</a>
    <a href="javascript:void(0)" data-href="/search">Search</a>
  </div>
  <div class="nav-links right">
    ${
      isInitialRender
        ? ``
        : `${
            user && user.profile
              ? `<a href="/auth/logout">Logout</a>`
              : `<a href="/auth/github" class="button github-button">
  <svg class="icon-github" viewBox="0 0 250 243.83" width="26" height="26">
    <path d="M125,3a125,125,0,0,0-39.5,243.61c6.25,1.15,8.53-2.71,8.53-6,0-3-.11-10.83-0.17-21.26-34.77,7.55-42.11-16.76-42.11-16.76-5.68-14.44-13.88-18.28-13.88-18.28-11.35-7.76.86-7.6,0.86-7.6,12.54,0.88,19.15,12.88,19.15,12.88C69,208.67,87.13,203.16,94.25,200c1.14-8.08,4.36-13.59,7.94-16.71-27.76-3.15-56.94-13.88-56.94-61.78A48.32,48.32,0,0,1,58.11,87.92c-1.29-3.16-5.57-15.87,1.23-33.08,0,0,10.5-3.36,34.37,12.81a118.48,118.48,0,0,1,62.59,0c23.86-16.18,34.34-12.81,34.34-12.81,6.82,17.21,2.53,29.92,1.24,33.08a48.24,48.24,0,0,1,12.85,33.54c0,48-29.23,58.59-57.07,61.68,4.49,3.86,8.49,11.49,8.49,23.15,0,16.71-.15,30.19-0.15,34.29,0,3.34,2.25,7.23,8.6,6A125,125,0,0,0,125,3Z" transform="translate(0 -3)" fill-rule="evenodd"></path>
  </svg>
  <span class="if-large">Log in with GitHub</span>
  <span class="if-small">Log in</span>
</a>`
          }`
    }
  </div>
</nav>
    
`;
