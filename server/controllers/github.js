const request = require('request');
const userController = require('./user');
const requestPromise = require('request-promise');

const getSetRepo = '__getset_code_sets';
const getSetRepoSeparator = ' | ';

// NB higher api rate limit on authenticated requests so always pass the access token

const getUsersGetSetRepo = (user, callback) => {
  const options = {
    url: `https://api.github.com/repos/${user.github.username}/${getSetRepo}?access_token=${user.tokens.github}`,
    headers: {
      'User-Agent': 'getset',
    },
  };

  request(options, (err, res, body) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${body}`);
    callback();
  });
};

const createFileOnGithub = (user, path, content, message, callback) => {
  const url = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}?access_token=${user.tokens.github}`;
  console.log(url);
  const options = {
    url,
    headers: {
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
      content: new Buffer(content).toString('base64'),
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


const updateFileOnGithub = (user, path, content, message, callback) => {
  const urlGET = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}?access_token=${user.tokens.github}`;
  const options = {
    url: urlGET,
    headers: {
      'User-Agent': 'getset',
    },
    json: true,
  };

  request(options, (errGET, resGET, bodyGET) => {
    console.log(`STATUS: ${resGET.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(resGET.headers)}`);
    console.log(`BODY: ${JSON.stringify(bodyGET)}`);

    const urlPUT = `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents/${path}?access_token=${user.tokens.github}`;
    console.log(urlPUT);
    const optionsPUT = {
      url: urlPUT,
      headers: {
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
        content: new Buffer(content).toString('base64'),
        branch: 'master',
      },
    };

    request(optionsPUT, (errPUT, resPUT, bodyPUT) => {
      console.log(`STATUS: ${resPUT.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(resPUT.headers)}`);
      console.log(`BODY: ${JSON.stringify(bodyPUT)}`);
      callback();
    });
  });
};

exports.create = (req, res) => {
  const rootFolder = `${req.body.name || 'unknown'}${getSetRepoSeparator}${(new Date()).toISOString()}`;
  const commitMessage = req.body.description || 'Initial commit of code set';
  createFileOnGithub(req.user, `${rootFolder}/meta.json`, req.body.metadataFileContent, commitMessage, () => {
    createFileOnGithub(req.user, `${rootFolder}/codes.txt`, req.body.codeSetFileContent, commitMessage, () => {
      res.send({});
    });
  });
};

exports.createUsersGetSetRepo = (user, callback) => {
  const options = {
    url: `https://api.github.com/user/repos?access_token=${user.tokens.github}`,
    headers: {
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
    const urls = users.map(user => `https://api.github.com/repos/${user.github.username}/${getSetRepo}/contents?access_token=${user.tokens.github}`);
    const lookup = {};
    users.forEach((user) => {
      lookup[user.github.username] = user;
    });
    const promises = urls.map(url => requestPromise({ url, headers: { 'User-Agent': 'getset' }, json: true }));
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
