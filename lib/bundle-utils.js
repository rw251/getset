import path from 'path';

const findFileFromName = (bundle, name) => Object
  .values(bundle).find(desc => (desc.name || '') === name);

const findMapFromName = (bundle, name) => findFileFromName(bundle, name).map;

const findHashFromName = (bundle, name) => findFileFromName(bundle, name).fileName;

const findChunkWithName = (bundle, name) => Object
  .values(bundle).find(desc => (desc.facadeModuleId || '').endsWith(name));

const getCodeAndDependencies = (bundle, name) => {
  const chunk = findChunkWithName(bundle, name);
  const output = [chunk.code];

  chunk.imports.forEach(dep => output.push(bundle[dep].code));

  return output.join('\n');
};

const findAssetWithName = (bundle, name) => {
  const parsedName = path.parse(name);

  return Object.values(bundle).find((desc) => {
    if (!desc.isAsset) return false;
    const parsedGraphName = path.parse(desc.fileName);
    if (parsedGraphName.ext !== parsedName.ext) return false;
    if (!parsedGraphName.name.startsWith(parsedName.name)) return false;
    const expectedHash = parsedGraphName.name.slice(parsedName.name.length);
    return /^-[0-9a-f]+$/.test(expectedHash);
  });
};

export {
  findFileFromName,
  findMapFromName,
  findHashFromName,
  findChunkWithName,
  getCodeAndDependencies,
  findAssetWithName,
};
