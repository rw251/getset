module.exports = {
  // See http://brunch.io for documentation.
  paths: {
    public: 'dist',
    watched: ['app', 'vendor', 'shared'],
  },

  files: {
    javascripts: {
      joinTo: {
        'libraries.js': /^(?!app\/)/,
        'app.js': /^app\//,
      },
      order: {
        before: [/jquery/],
      },
    },
    stylesheets: {
      joinTo: 'app.css',
    },
    templates: {
      joinTo: 'app.js',
    },
  },

  plugins: {
    babel: {
      pattern: /sw\.js$/,
    },
  },
};
