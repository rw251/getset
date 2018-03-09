module.exports = {
  extends: [
    "airbnb-base"
  ],
  rules: {
    "comma-dangle": ["error", {
      arrays: "always-multiline",
      objects: "always-multiline",
      imports: "always-multiline",
      exports: "always-multiline",
      functions: "never"
    }],
    "no-param-reassign": ["error", { "props": false }],
    "no-underscore-dangle": ["error", { "allow": ["_id"] }],
    "object-curly-newline": ["error", {
      ObjectExpression: { multiline: true },
      ObjectPattern: { multiline: true }
    }]
  }
};
