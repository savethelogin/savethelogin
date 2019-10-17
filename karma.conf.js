const path = require('path');

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: ['test/test.js'],
    browsers: ['chromeExtension'],
    customLaunchers: {
      chromeExtension: {
        base: 'ChromeHeadless',
        flags: ['--load-extension=' + path.join(__dirname, 'dist'), '--no-sandbox'],
      },
    },
    singleRun: true,
    preprocessors: {
      'test/test.js': ['webpack', 'coverage'],
    },
    reporters: ['progress', 'coverage', 'coverage-istanbul'],
    coverageIstanbulReporter: {
      reports: ['text-summary'],
      fixWebpackSourcePaths: true,
      dir: path.join(__dirname, 'coverage'),
      verbose: false,
    },
    webpack: require('./webpack.config.js'),
    webpackMiddleware: {
      stats: 'errors-only',
    },
    plugins: [
      'karma-mocha',
      'karma-webpack',
      'karma-coverage',
      'karma-coverage-istanbul-reporter',
      'karma-chrome-launcher',
    ],
  });
};
