'use strict';

module.exports = {
  plugins: ['node_modules/jsdoc-vuejs'],
  recurseDepth: 10,
  source: {
    exclude: ['src/plugins'],
    includePattern: '.+\\.(js(doc|x)?|vue)$',
    excludePattern: '(^|\\/|\\\\)_',
  },
  sourceType: 'module',
  tags: {
    allowUnknownTags: true,
    dictionaries: ['jsdoc', 'closure'],
  },
  templates: {
    cleverLinks: false,
    monospaceLinks: false,
  },
  opts: {
    // "template": "templates/default",  // same as -t templates/default
    encoding: 'utf8', // same as -e utf8
    destination: './docs/', // same as -d ./out/
    recurse: true, // same as -r
    // "tutorials": "path/to/tutorials", // same as -u path/to/tutorials
  },
};
