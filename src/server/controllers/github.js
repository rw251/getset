const request = require('request');
const userController = require('./user');
const requestPromise = require('request-promise');
const atob = require('atob');
const btoa = require('btoa');

const getSetRepo = '__getset_code_sets';
const getSetRepoSeparator = ' | ';

// NB higher api rate limit on authenticated requests so always pass the access token

// const getUsersGetSetRepo = (user, callback) => {
//   const options = {
//     url: `https://api.github.com/repos/${user.github.username}/${getSetRepo}`,
//     headers: {
//       Authorization: `token ${user.tokens.github}`,
//       'User-Agent': 'getset',
//     },
//   };

//   request(options, (err, res, body) => {
//     console.log(`STATUS: ${res.statusCode}`);
//     console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//     console.log(`BODY: ${body}`);
//     callback();
//   });
// };

const createFileOnGithub = (user, path, content, message, callback) => {
  const url = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}`;
  console.log(url);
  const options = {
    url,
    headers: {
      Authorization: `token ${user.tokens.github}`,
      'User-Agent': 'getset',
    },
    json: true,
    method: 'PUT',
    body: {
      path,
      message,
      committer: {
        name: user.profile.name,
        email: user.email,
      },
      content: btoa(content), // converts to base64
      branch: 'master',
    },
  };

  request(options, (err, res, body) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${JSON.stringify(body)}`);
    callback();
  });
};

const getFileFromGithub = (user, path, callback) => {
  const url = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}`;
  const options = {
    url,
    headers: {
      Authorization: `token ${user.tokens.github}`,
      'User-Agent': 'getset',
    },
    json: true,
  };

  request(options, (err, res, body) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${JSON.stringify(body)}`);
    if (err) return callback(err);
    if (res.statusCode !== 200) return callback(new Error('No 200 from github'));
    return callback(null, body);
  });
};

const updateFileOnGithub = (user, path, content, message, callback) => {
  getFileFromGithub(user, path, (errGET, bodyGET) => {
    if (errGET) {
      console.log(errGET);
      return callback(errGET);
    }
    const urlPUT = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}`;
    console.log(urlPUT);
    const optionsPUT = {
      url: urlPUT,
      headers: {
        Authorization: `token ${user.tokens.github}`,
        'User-Agent': 'getset',
      },
      json: true,
      method: 'PUT',
      body: {
        path,
        message,
        committer: {
          name: user.profile.name,
          email: user.email,
        },
        sha: bodyGET.sha,
        content: btoa(content), // converts to base64
        branch: 'master',
      },
    };

    return request(optionsPUT, (errPUT, resPUT, bodyPUT) => {
      console.log(`STATUS: ${resPUT.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(resPUT.headers)}`);
      console.log(`BODY: ${JSON.stringify(bodyPUT)}`);
      callback();
    });
  });
};

const deleteFileFromGithub = (user, path, sha, callback) => {
  const url = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}`;
  console.log(url);
  const options = {
    url,
    headers: {
      Authorization: `token ${user.tokens.github}`,
      'User-Agent': 'getset',
    },
    json: true,
    method: 'DELETE',
    body: {
      path,
      message: `Removing code set: ${path}`,
      committer: {
        name: user.profile.name,
        email: user.email,
      },
      sha,
      branch: 'master',
    },
  };

  request(options, (err, res, body) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${JSON.stringify(body)}`);
    callback();
  });
};

const deleteFilesFromGithub = (user, files, callback) => {
  if (!files || files.length === 0) return callback();
  const file = files.pop();
  return deleteFileFromGithub(user, file.path, file.sha, () => {
    if (files.length === 0) return callback();
    return deleteFilesFromGithub(user, files, callback);
  });
};

const deleteRepo = (user, path, callback) => {
  // first find all files
  const url = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}`;
  const options = {
    url,
    headers: {
      Authorization: `token ${user.tokens.github}`,
      'User-Agent': 'getset',
    },
    json: true,
  };

  request(options, (err, res, body) => {
    deleteFilesFromGithub(user, body, callback);
  });
};

exports.name = req => `${req.body.name || 'unknown'}${getSetRepoSeparator}${(new Date()).toISOString()}`;
exports.description = req => req.body.description || 'Initial commit of code set';
exports.message = req => req.body.message || 'Code set updated';
exports.repoUrl = (req, name) => `https://github.com/${req.user.github.username}/${getSetRepo}/tree/master/${name}`;
exports.githubSeparator = getSetRepoSeparator;

exports.create = (req, name, commitMessage, callback) => {
  createFileOnGithub(req.user, `${name}/meta.json`, req.body.metadataFileContent, commitMessage, () => {
    createFileOnGithub(req.user, `${name}/codes.txt`, req.body.codeSetFileContent, commitMessage, () => callback());
  });
};

exports.update = (req, name, commitMessage, callback) => {
  updateFileOnGithub(req.user, `${name}/meta.json`, req.body.metadataFileContent, commitMessage, () => {
    updateFileOnGithub(req.user, `${name}/codes.txt`, req.body.codeSetFileContent, commitMessage, () => callback());
  });
};

exports.get = (req, name, callback) => {
  getFileFromGithub(req.user, `${name}/meta.json`, (errMeta, metadataFile) => {
    getFileFromGithub(req.user, `${name}/codes.txt`, (errCodes, codesetFile) => {
      if (errMeta || errCodes) return callback(errMeta || errCodes);
      const metadata = JSON.parse(atob(metadataFile.content));
      return callback(null, {
        metadata,
        codeset: atob(codesetFile.content),
        githubSet: {
          name,
          description: metadata.description,
          createdOn: metadata.createdOn,
        },
      });
    });
  });
};

exports.createUsersGetSetRepo = (user, callback) => {
  const options = {
    url: 'https://api.github.com/user/repos',
    headers: {
      Authorization: `token ${user.tokens.github}`,
      'User-Agent': 'getset',
    },
    json: true,
    method: 'POST',
    body: {
      name: getSetRepo,
      auto_init: true,
    },
  };

  request(options, (err, res, body) => {
    console.log(`ERR:${err}`);
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${JSON.stringify(body)}`);
    callback();
  });
};

exports.search = (req, res, next) => {
  userController.githubUsers((err, users) => {
    if (err) return next(err);
    const urlsAndHeaders = users.map(user => ({
      url: `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents`,
      headers: {
        Authorization: `token ${user.tokens.github}`,
        'User-Agent': 'getset',
      },
    }));
    const lookup = {};
    users.forEach((user) => {
      lookup[user.github.username] = user;
    });
    const promises = urlsAndHeaders
      .map(urlAndHeader => requestPromise({ json: true, ...urlAndHeader }));
    return Promise
      .all(promises)
      .then((results) => {
        // results is an array of all the parsed bodies in order
        console.log(results);
        const mergedResults = [].concat(...results);
        const stuffToReturn = mergedResults.filter(result => result.type === 'dir').map((result) => {
          const parts = result.name.split(getSetRepoSeparator);
          const username = result.url.split('/')[4];
          return { name: parts[0], createdOn: new Date(parts[1]), createdBy: `${lookup[username].profile.name} <${lookup[username].email}>`, link: result.html_url };
        });
        return res.send(stuffToReturn);
      })
      .catch(errPromise => next(errPromise));
  });
};

exports.delete = (user, path, callback) => {
  deleteRepo(user, path, (err) => {
    if (err) return callback(err);
    return callback();
  });
};
