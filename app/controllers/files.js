const JSZip = require('jszip');
const FileSaver = require('file-saver');
const global = require('../scripts/global');

const getMetaDataFileContent = (propArray, includeTerms, excludeTerms, terminology, createdOn) => {
  const nowish = new Date();
  const metadata = {
    includeTerms,
    excludeTerms,
    terminology,
    createdOn: createdOn || nowish,
  };
  if (global.user) {
    metadata.createdBy = {};
    if (global.user.name) metadata.createdBy.name = global.user.name;
    if (global.user.email) metadata.createdBy.email = global.user.email;
  }
  if (propArray && propArray.length > 0) {
    propArray.forEach((prop) => {
      metadata[prop.name] = prop.value;
    });
  }
  metadata.lastUpdated = nowish;
  return metadata;
};
const getMetaDataFile = (propArray, includeTerms, excludeTerms, terminology, createdOn) => {
  const metadata = getMetaDataFileContent(propArray, includeTerms, excludeTerms, terminology, createdOn);
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json;charset=utf-8' });
  return blob;
};
const getCodeSetFileContent = (currentGroups) => {
  const currentCodeSet = [];
  currentGroups.matched.forEach((g, gi) => {
    g.forEach((code, i) => {
      if (!currentGroups.matched[gi][i].exclude) {
        currentCodeSet.push(code.code || code.clinicalCode);
      }
    });
  });
  return currentCodeSet;
};
const getCodeSetFile = (currentGroups) => {
  const currentCodeSet = getCodeSetFileContent(currentGroups);
  const blob = new Blob([currentCodeSet.join('\r\n')], { type: 'text/plain;charset=utf-8' });
  return blob;
};

const triggerDownload = (file, name) => {
  FileSaver.saveAs(file, name);
};

const zipFiles = (files) => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.content);
  });
  let promise = null;
  if (JSZip.support.uint8array) {
    promise = zip.generateAsync({ type: 'uint8array' });
  } else {
    promise = zip.generateAsync({ type: 'string' });
  }
  return promise;
};

export {
  triggerDownload, zipFiles, getCodeSetFileContent,
  getMetaDataFileContent, getCodeSetFile, getMetaDataFile,
};
