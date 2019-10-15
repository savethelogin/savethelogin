const path = require('path');
const istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: ['test/**/*.js'],
    browsers: ['chromeExtension'],
    customLaunchers: {
      chromeExtension: {
        base: 'ChromeHeadless',
        flags: ['--load-extension=' + path.join(__dirname, 'dist')],
      },
    },
    singleRun: true,
    webpack: require('./webpack.config.js'),
    preprocessors: {
      'test/**/*.js': ['webpack'],
    },
    reporters: ['progress', 'coverage', 'coverage-istanbul'],
    coverageIstanbulReporter: {
      reports: ['text-summary'],
      dir: path.join(__dirname, 'coverage'),
      combineBrowserReports: true,
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: true,
      // enforce percentage thresholds
      thresholds: {
        // set to `true` to not fail the test command when thresholds are not met
        emitWarning: false,
        // thresholds for all files
        global: {
          statements: 100,
          lines: 100,
          branches: 100,
          functions: 100,
        },
      },
      verbose: false, // output config used by istanbul for debugging
      // `instrumentation` is used to configure Istanbul API package.
      instrumentation: {
        // To include `node_modules` code in the report.
        'default-excludes': false,
      },
    },
    browserify: {
      transform: [
        [
          istanbul({
            ignore: ['node_modules/**', 'test/**/*.js'],
            includeUntested: false,
            defaultIgnore: true,
          }),
          { global: true },
        ],
      ],
    },
    plugins: ['karma-mocha', 'karma-coverage', 'karma-coverage-istanbul-reporter', 'karma-chrome-launcher', 'karma-webpack'],
  });
};
