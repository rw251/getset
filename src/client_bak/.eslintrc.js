module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true
  },
  rules: {
    // let's allow console.error
    "no-console": ["error", { "allow": ["error"] }]
  }
}