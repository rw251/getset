import { getMetaDataFileContent, getCodeSetFileContent } from './files';


const saveToGithub = (
  currentGroups, propArray, includeTerms,
  excludeTerms, terminology, createdOn
) => {
  const metadata = getMetaDataFileContent(
    propArray, includeTerms,
    excludeTerms, terminology, createdOn
  );
  const codeSet = getCodeSetFileContent(currentGroups);
  const commitMessage = metadata.message;
  delete metadata.message;
  const metadataFileContent = JSON.stringify(metadata, null, 2);
  const codeSetFileContent = codeSet.join('\r\n');
  const dataToSend = {
    metadataFileContent,
    codeSetFileContent,
    name: metadata.name,
    description: metadata.description,
    message: metadata.description,
  };
  if (currentGroups.githubSet) {
    dataToSend.codeSet = currentGroups.githubSet;
    dataToSend.message = commitMessage;
  }
  $
    .ajax({
      type: 'POST',
      url: '/save/to/github',
      data: JSON.stringify(dataToSend),
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((set) => {
      currentGroups.githubSet = set;
      currentGroups.isDirty = false;
      $('#saveModal').modal('hide');
    })
    .fail(() => {
      alert('Something went wrong and your code set is not saved. Feel free to try again but I\'m not very hopeful.');
    });
};

export { saveToGithub };
