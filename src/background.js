/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from './classes/Config';
import Context from './classes/Context';

const { PROJECT_PREFIX } = config;

// Check extension disabled
chrome.storage.sync.get(
  [
    `${PROJECT_PREFIX}_disabled`,
    `${PROJECT_PREFIX}_opt_plain_text`,
    `${PROJECT_PREFIX}_opt_session_hijack`,
  ],
  items => {
    Context.enabled = !items[`${PROJECT_PREFIX}_disabled`] ? true : false;
    Context.plainText =
      items[`${PROJECT_PREFIX}_opt_plain_text`] ||
      items[`${PROJECT_PREFIX}_opt_plain_text`] === undefined
        ? true
        : false;
    Context.sessHijack = items[`${PROJECT_PREFIX}_opt_session_hijack`] ? true : false;
  }
);

/**
 * Import modules
 */
/* https://webpack.js.org/guides/dependency-management/#require-context */
const cache = {};

function importAll(r) {
  r.keys().forEach(key => (cache[key] = r(key)));
}

// Import every module not start with underscore
importAll(require.context('./modules/', true, /[^_]*Entry\.js$/));
