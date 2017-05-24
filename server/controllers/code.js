/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const Code = require('../models/Code');

exports.search = (req, res) => {
  Code.find({ $text: { $search: req.params.searchterm } }, (errFirst, codes) => {
    if (errFirst) {
      req.log(errFirst);
      return res.send();
    }
    const codesForQuery = codes.map((v) => {
      if (req.params.terminology === 'Readv2') {
        return v._id.substr(0, 5);
      }
      return v._id;
    });
    const query = {
      $and: [
        {
          p: {
            $in: codesForQuery, // matches all descendents of the codes already found
          },
        },
        {
          _id: {
            $not: {
              $in: codesForQuery, // but doesn't match any of the original codes
            },
          },
        },
      ],
    };
    return Code.find(query, (errSecond, allCodes) => {
      if (errSecond) {
        req.log(errSecond);
        return res.send();
      }
      return res.send({
        codes: allCodes.concat(codes),
        searchTerm: req.params.searchterm,
        timestamp: Date.now(),
      });
    });
  });
};

