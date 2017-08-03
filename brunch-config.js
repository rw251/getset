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
      order: {
        before: [
          'vendor/styles/bootstrap.scss',
        ],
      },
    },
    templates: {
      joinTo: 'app.js',
    },
  },

  plugins: {
    babel: {
      // pattern: /sw\.js$/,
    },
    sass: {
      options: {
        includePaths: ['app/styles'],
      },
    },
  },
};
