const path = require('path');

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'browserify'],
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
      'test/test.js': ['browserify', 'coverage'],
    },
    reporters: ['progress', 'coverage', 'coverage-istanbul'],
    coverageIstanbulReporter: {
      reports: ['text-summary'],
      dir: path.join(__dirname, 'coverage'),
      verbose: false,
    },
    plugins: ['karma-mocha', 'karma-browserify', 'karma-coverage', 'karma-coverage-istanbul-reporter', 'karma-chrome-launcher'],
  });
};
