/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const Code = require('../models/Code');

exports.search = (req, res) => {
  Code.find({ $text: { $search: req.params.searchterm } }, (errFirst, codes) => {
    if (errFirst) {
      req.log(errFirst);
      return res.send();
    }
    return Code.find({ p: { $in: codes.map((v) => {
      if (req.params.terminology === 'Readv2') {
        return v._id.substr(0, 5);
      }
      return v._id;
    }) } }, (errSecond, allCodes) => {
      if (errSecond) {
        req.log(errSecond);
        return res.send();
      }
      return res.send(allCodes);
    });
  });
};

