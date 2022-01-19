const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const modelCache = {};

const createModel = ({ id, version }) => {
  const CodeSchema = new mongoose.Schema(
    {
      _id: String, // The clinical code
      t: String, // A | separated list of
      p: [String],
      a: [String],
      w: [String],
    },
    { collection: `codes-${id}-${version}` }
  );

  CodeSchema.virtual('terminology').get(() => id);
  CodeSchema.virtual('version').get(() => version);
  CodeSchema.virtual('clinicalCode').get(function getCode() {
    return this._id;
  });

  CodeSchema.plugin(mongooseLeanVirtuals);

  modelCache[id][version] = mongoose.model(`Code${id}${version}`, CodeSchema);
  return modelCache[id][version];
};

module.exports = ({ id, version }) => {
  if (!modelCache[id]) modelCache[id] = {};
  return modelCache[id][version] || createModel({ id, version });
};
