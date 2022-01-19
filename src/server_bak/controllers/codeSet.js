const CodeSet = require('../models/CodeSet');
const github = require('./github');

const get = (id, callback) => {
  CodeSet.findOne({ _id: id }, (err, codeset) => {
    if (err) return callback(err);
    return callback(null, codeset);
  });
};

const create = (codeSet, callback) => {
  const codeSetToSave = new CodeSet(codeSet);
  codeSetToSave.save((err, savedCodeSet) => {
    if (err) return callback(err);
    return callback(null, savedCodeSet._id);
  });
};

const update = (codeSet, id, callback) => {
  codeSet._id = id;
  const codeSetToSave = new CodeSet(codeSet);
  CodeSet.findOneAndUpdate({ _id: id }, codeSetToSave, (err) => {
    if (err) return callback(err);
    return callback();
  });
};

const search = (filter, callback) => {
  CodeSet.find(filter, (err, codeSets) => {
    if (err) return callback(err);
    return callback(null, codeSets);
  });
};

const remove = (user, id, callback) => {
  CodeSet.findOneAndRemove({ _id: id }, (err, codeSet) => {
    if (err) return callback(err);
    return github.delete(user, codeSet.name, (errDelete) => {
      if (errDelete) {
        // didn't delete from github so let's add it back to mongo
        return codeSet.save((errResave) => {
          if (errResave) return callback(errResave);
          return callback(errDelete);
        });
      }
      return callback();
    });
  });
};

exports.create = (req, res, next) => {
  const name = github.name(req);
  const createdOn = new Date(name.split(github.githubSeparator)[1]);
  const message = github.message(req);
  const description = github.description(req);
  const repoUrl = github.repoUrl(req, name);
  const codeSet = {
    name,
    description,
    user: {
      name: req.user.profile.name,
      email: req.user.email,
      githubUsername: req.user.github.username,
    },
    repoUrl,
    createdOn,
    lastUpdated: createdOn,
    terminologies: req.body.terminologies,
    count: req.body.codeCount,
  };
  if (req.body.codeSet) {
    // already saved we are updating
    codeSet.name = req.body.codeSet.name;
    codeSet.createdOn = req.body.codeSet.createdOn;
    codeSet.repoUrl = req.body.codeSet.repoUrl;
    update(codeSet, req.body.codeSet.codeSetId, (err) => {
      if (err) return next(err);
      return github.update(req, codeSet.name, message, () => res.send({
        name: codeSet.name,
        description,
        createdOn: req.body.codeSet.createdOn,
        repoUrl: req.body.codeSet.repoUrl,
        codeSetId: req.body.codeSet.codeSetId,
      }));
    });
  } else {
    create(codeSet, (err, codeSetId) => {
      if (err) return next(err);
      return github.create(req, name, description, () => res.send({
        name,
        description,
        createdOn,
        repoUrl,
        codeSetId,
      }));
    });
  }
};

exports.search = (req, res, next) => {
  search({}, (err, codeSets) => {
    if (err) return next(err);
    return res.send(codeSets);
  });
};

exports.delete = (req, res, next) => {
  remove(req.user, req.params.id, (err) => {
    if (err) return next(err);
    return res.send({});
  });
};

exports.get = (req, res, next) => {
  get(req.params.id, (err, codeset) => {
    github.get(req.user, codeset.user.githubUsername, codeset.name, (errGitGet, codesetFiles) => {
      if (err || errGitGet) return next(err || errGitGet);
      codesetFiles.githubSet.repoUrl = codeset.repoUrl;
      codesetFiles.githubSet.codeSetId = codeset._id;
      return res.send(codesetFiles);
    });
  });
};
