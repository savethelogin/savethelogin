module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: ['dist/test.js'],
    browsers: ['chromeExtension'],
    customLaunchers: {
      chromeExtension: {
        base: 'ChromeHeadless',
        flags: ['--load-extension=' + __dirname + '/dist'],
      },
    },
    singleRun: true,
  });
};
