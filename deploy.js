/* eslint-disable import/no-extraneous-dependencies */
const inquirer = require('inquirer');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const versions = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
};

const incrementVersion = ({ versionType, message }) => exec(`npm version ${versionType} -m "Upgrade to %s. ${message}"`);
const pushTagsToGit = () => exec('git push --follow-tags');

inquirer
  .prompt([{
    name: 'versionType',
    type: 'list',
    message: 'What type of versioning do you want to do (vX.Y.Z - major bumps X, minor bumps Y, patch bumps Z)',
    choices: Object.keys(versions),
    default: versions.patch,
  }, {
    name: 'message',
    type: 'input',
    message: 'Enter a message for the tag',
    validate: input => (input.length > 0 ? true : 'Must leave a message - think of your future self!!'),
  }])
  .then(incrementVersion)
  .then(pushTagsToGit)
  .catch(err => console.log(err));

