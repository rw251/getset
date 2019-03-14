export default ({ user, list }) => `
<div class="scrollable-parent">
  <table class="table table-condensed table-striped table-bordered">
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Created by</th>
        <th>When</th>
        <th>Last updated</th>
        <th>Link</th>
        <th>Terminologies</th>
        <th># codes</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${list.map(item => `
      <tr>
        <td>${item.name ? item.name.split(' | ')[0] : 'Unknown'}</td>
        <td>${item.description}</td>
        <td>${item.user.name}</td>
        <td>${item.createdOn}</td>
        <td>${item.lastUpdated}</td>
        <td>
          <a href="${item.repoUrl}" target="_blank" title="${item.repoUrl}">
          ${item.repoUrl.substr(0, 30)}...
          </a>
        </td>
        <td>${item.terminologies.join(', ')}</td>
        <td>${item.count || ''}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Actions<span class="caret"></span></button>
            <ul class="dropdown-menu dropdown-menu-right">
              <li>
                <a class="btn-edit" href="#" data-id="${item._id}" data-path="${item.name}">
                  <i class="fa fa-edit fa-fw"></i>${user.email === item.user.email ? 'Edit' : 'Extend and reuse'}
                </a>
              </li>
              <li>
                <a class="btn-download" href="#" data-id="${item._id}" data-path="${item.name}">
                  <i class="fa fa-download fa-fw"></i>Download
                </a>
              </li>
              <li>
                <a class="btn-validate" href="#" data-id="${item._id}" data-path="${item.name}">
                  <i class="fa fa-check fa-fw"></i>Validate
                </a>
              </li>
              ${user.email === item.user.email
    ? `
              <li>
                <a class="btn-delete" href="#" data-id="${item._id}" data-path="${item.name}">
                  <i class="fa fa-trash fa-fw"></i>Delete
                </a>
              </li>`
    : ''}            
            </ul>
          </div>
        </td>
      </tr>
  `).join('')}
    </tbody>
  </table>
</div>

`;

// .scrollable-parent
//   table.table.table-condensed.table-striped.table-bordered
//     thead
//       tr
//         th Name
//         th Description
//         th Created by
//         th When
//         th Last updated
//         th Link
//         th Terminologies
//         th # codes
//         th
//     tbody
//       each item in list
//         tr
//           td= item.name.split(' | ')[0]
//           td= item.description
//           td= item.user.name
//           td= item.createdOn
//           td= item.lastUpdated
//           td
//             a(href=item.repoUrl, target='_blank', title=item.repoUrl)= `${item.repoUrl.substr(0,30)}...`
//           td= item.terminologies.join(', ')
//           td= item.count
//           td
//             .btn-group
//               button.btn.btn-default.dropdown-toggle(type='button', data-toggle='dropdown', aria-haspopup='true', aria-expanded='false')
//                 | Actions
//                 span.caret
//               ul.dropdown-menu.dropdown-menu-right
//                 li
//                   a.btn-edit(href='#',data-id=item._id, data-path=item.name)
//                     i.fa.fa-pencil.fa-fw
//                     if(user.email === item.user.email)
//                       | Edit
//                     else
//                       | Extend and reuse
//                 li
//                   a.btn-download(href='#',data-id=item._id, data-path=item.name)
//                     i.fa.fa-download.fa-fw
//                     | Download
//                 li
//                   a.btn-validate(href='#',data-id=item._id, data-path=item.name)
//                     i.fa.fa-check.fa-fw
//                     | Validate
//                 if(user.email === item.user.email)
//                   li
//                     a.btn-delete(href='#',data-id=item._id, data-path=item.name)
//                       i.fa.fa-trash.fa-fw
//                       | Delete

