export default breadcrumbs => `
    ${breadcrumbs
    .map((breadcrumb, index) => (index === breadcrumbs.length - 1
      ? `
      <li>
        <span>${breadcrumb.label}</span>
      </li>`
      : `
      <li>
        <a class="margin-right-xs" href="javascript:void(0)" data-href=${breadcrumb.path}>
          ${breadcrumb.label}
        </a>
      </li>
    `
    ))
    .join('')}
  `;
