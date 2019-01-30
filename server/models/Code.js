const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const modelCache = {};

const createModel = (terminologyName) => {
  const CodeSchema = new mongoose.Schema({
    _id: String, // The clinical code
    t: String, // A | separated list of
    p: [String],
    a: [String],
    w: [String],
  }, { collection: `codes-${terminologyName}` });

  CodeSchema.virtual('terminology').get(() => terminologyName);
  CodeSchema.virtual('clinicalCode').get(function getCode() {
    return this._id;
  });

  CodeSchema.plugin(mongooseLeanVirtuals);

  modelCache[terminologyName] = mongoose.model(`Code${terminologyName}`, CodeSchema);
  return modelCache[terminologyName];
};

module.exports = terminologyName => modelCache[terminologyName] || createModel(terminologyName);
