const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const config = require('../config');

const CodeSchema = new mongoose.Schema({
  _id: {
    d: { type: String, enum: ['EMIS', 'Readv2', 'SNOMED CT'] },
    c: { type: String }, // The clinical code
  },
  t: String, // A | separated list of
  p: [String],
  a: String,
  c: [String],
});

CodeSchema.virtual('terminology').get(function getTerm() {
  return this._id.d;
});
CodeSchema.virtual('clinicalCode').get(function getCode() {
  return this._id.c;
});

CodeSchema.plugin(mongooseLeanVirtuals);

module.exports = (terminology) => {
  let model = mongoose.model('Code', CodeSchema);
  switch (terminology) {
    case 'EMIS':
      if (config.MONGO_URL_EMIS) {
        model = mongoose.createConnection(config.MONGO_URL_EMIS).model('Code', CodeSchema);
      }
      break;
    default:
  }
  return model;
};
