/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
/**
 * @file Group of common utility functions
 */
import config from '@/common/Config';
const { PROJECT_PREFIX } = config;

import dat from './public_suffix_list.dat';
const suffixes = dat.split('\n').filter(line => {
  return !(line.substr(0, 2) === '//' || !line.trim());
});

/**
 * Return current browser name
 *
 * @return {String}
 * @throws {Error} Unknown browser
 */
export function getBrowser() {
  if (typeof whale === 'object') {
    return 'whale';
  } else if (typeof browser === 'object') {
    return 'firefox';
  } else if (typeof chrome === 'object') {
    return 'chrome';
  } else {
    throw new Error('Unknown browser');
  }
}

/**
 * Check mobile device
 *
 * @return {Boolean}
 */
export function isMobile() {
  if (typeof navigator === 'object') {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      return true;
    }
  }
  return false;
}

/**
 * Common promise handler
 */
function promiseHandler(
  {
    resolve,
    reject = value => {
      value;
    },
  },
  value
) {
  if (chrome.runtime.lastError) {
    return reject(value);
  } else {
    return resolve(value);
  }
}

/**
 * Increase badge number
 */
export function increaseBadgeCount(tabId) {
  getBadgeText(tabId).then(result => {
    console.log('badge:', result);
    let count;
    if (!result) count = 0;
    else count = parseInt(result);
    ++count;
    setBadgeText({ text: count.toString(), tabId: tabId });
  });
}

export function clearBadgeCount(tabId) {
  setBadgeText({ text: '', tabId: tabId });
}

/**
 * Set extension icon badge text
 *
 * @return {Promise}
 */
export function setBadgeText({ text, tabId = undefined }) {
  return new Promise((resolve, reject) => {
    chrome.browserAction.setBadgeText(
      {
        text: text,
        tabId: tabId,
      },
      () => {
        promiseHandler({ resolve: resolve, reject: reject });
      }
    );
  });
}

/**
 * Get extension icon badge text
 *
 * @return {Promise}
 */
export function getBadgeText(tabId = undefined) {
  return new Promise((resolve, reject) => {
    let options = {};
    if (tabId) options['tabId'] = tabId;
    chrome.browserAction.getBadgeText(options, result => {
      promiseHandler({ resolve: resolve, reject: reject }, result);
    });
  });
}

/**
 * Create notification which shows on system tray
 *
 * @return {Promise}
 */
export function createNotification({
  notificationId = undefined,
  type = 'basic',
  iconUrl = '/icons/icon.png',
  title,
  message,
  contextMessage,
}) {
  return new Promise((resolve, reject) => {
    let options = {
      type: type,
      iconUrl: iconUrl,
      title: title,
      message: message,
    };
    if (contextMessage) options['contextMessage'] = contextMessage;

    chrome.notifications.create(notificationId, options, id => {
      promiseHandler({ resolve: resolve, reject: reject }, id);
    });
  });
}

/**
 * Remove notification by notification id
 *
 * @param  {String}  notificationId - ID of notification
 * @return {Promise}
 */
export function clearNotification(notificationId = undefined) {
  return new Promise((resolve, reject) => {
    chrome.notifications.clear(notificationId, wasCleared => {
      promiseHandler({ resolve: resolve, reject: reject }, wasCleared);
    });
  });
}

/**
 * Get items from storage API
 *
 * @param  {String}            [area=local]
 * @param  {(String|String[])} keys
 * @return {Promise}
 */
export function getStorage({ area = 'local', keys = null }) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].get(keys, items => {
      promiseHandler({ resolve: resolve, reject: reject }, items);
    });
  });
}

/**
 * Set items to storage
 *
 * @param  {String} [area=local]
 * @param  {Object} items
 * @return {Promise}
 */
export function setStorage({ area = 'local', items }) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].set(items, () => {
      promiseHandler({ resolve: resolve, reject: reject });
    });
  });
}

/**
 * Remove items from storage
 *
 * @param  {String}            [area=local]
 * @param  {(String|String[])} keys
 * @return {Promise}
 */
export function removeStorage({ area = 'local', keys = undefined }) {
  return new Promise((resolve, reject) => {
    let callback = () => {
      promiseHandler({ resolve: resolve, reject: reject });
    };
    if (keys === undefined) {
      chrome.storage[area].clear(callback);
    } else {
      chrome.storage[area].remove(keys, callback);
    }
  });
}

/**
 * Get tabs by options
 *
 * @param  {String}            [area=local]
 * @param  {(String|String[])} keys
 * @return {Promise}
 */
export function queryTab(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, result => {
      promiseHandler({ resolve: resolve, reject: reject }, result);
    });
  });
}

/**
 * Get current tab object
 *
 * @return {Promise}
 */
export function currentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.getCurrent(tab => {
      promiseHandler({ resolve: resolve, reject: reject }, tab);
    });
  });
}

/**
 * Create new tab by using properties
 *
 * @param  {Object}  createProperties
 * @return {Promise}
 */
export function createTab(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, tab => {
      promiseHandler({ resolve: resolve, reject: reject }, tab);
    });
  });
}

/**
 * Update tab by id using update properties
 *
 * @param  {Number} [tabId=undefined]
 * @param  {Object} updateProperties
 * @return {Promise}
 */
export function updateTab({ tabId = undefined, updateProperties }) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, tab => {
      promiseHandler({ resolve: resolve }, tab);
    });
  });
}

/**
 * Remove tabs by tab ids
 *
 * @param  {(Number|Number[])} tabIds
 * @return {Promise}
 */
export function removeTab(tabIds) {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabIds, () => {
      promiseHandler({ resolve: resolve, reject: reject });
    });
  });
}

/**
 * Create runtime connection by using project prefix
 */
export function openDefaultPort() {
  return chrome.runtime.connect({ name: `${PROJECT_PREFIX}` });
}

/**
 * Execute script on tab
 */
export function executeScript({ tabId = undefined, details }) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, details, results => {
      promiseHandler({ resolve: resolve, reject: reject }, results);
    });
  }).catch(logError);
}

/**
 * Handling error
 */
export function logError(e) {
  if (chrome.runtime.lastError) {
    console.log(e, chrome.runtime.lastError);
  } else {
    console.log(e);
  }
}

/**
 * Return source code of function
 *
 * @param  {Function} func
 * @return {String}
 */
export function funcToStr(func) {
  if (typeof func !== 'function') throw new Error('func is not a function');
  return func.toString().replace(/^function\s\w*\(.*?\)\s\{(.*)\}$/s, '$1');
}

export function dataURItoBlob(dataURI) {
  // https://stackoverflow.com/a/12300351

  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  let byteString = atob(dataURI.split(',')[1]);
  // separate out the mime component
  let mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0];
  // write the bytes of the string to an ArrayBuffer
  let ab = new ArrayBuffer(byteString.length);
  // create a view into the buffer
  let ia = new Uint8Array(ab);
  // set the bytes of the buffer to the correct values
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  // write the ArrayBuffer to a blob, and you're done
  let blob = new Blob([ab], { type: mimeString });

  return blob;
}

export function extractRootDomain(url) {
  // Extract original(top) domain of url
  // return (hostname.match(/([a-z0-9_-]{3,}((\.[a-z]{2}){1,2}|\.[a-z]{3,}))$/i) || [''])[0].replace(
  //   /^www[0-9]*\./i,
  //   ''
  // );
  let domain = url.replace(/^.*?:?\/\//, '').split('/')[0];
  let tokens = domain.split('.').reverse();
  let i = tokens.length;
  let root_domain = '';
  do {
    root_domain = tokens[tokens.length - i] + (root_domain ? '.' + root_domain : '');
    if (!suffixes.includes(root_domain)) break;
  } while (i--);
  return root_domain;
}

/**
 * Filter out duplicate items in array
 *
 * @param  {Array} array
 * @return {Array}
 */
export function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}

/**
 * Escape regex predefined characters
 */
function escapeRegexp(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function toPascalCase({ text, separator }) {
  const prefixPattern = new RegExp(`^([$_-]*)`);
  const suffixPattern = new RegExp(`([$_-]*)$`);

  let string = text;

  let prefix = string.match(prefixPattern)[1];
  let suffix = string.match(suffixPattern)[1];

  string = string.replace(prefixPattern, '').replace(suffixPattern, '');

  let result = prefix;
  let chunks = string.split(separator).filter(x => x);
  for (let i = 0; i < chunks.length; i++) {
    result += chunks[i][0].toUpperCase() + chunks[i].substring(1);
  }
  result += suffix;

  return result;
}

export function fromSnakeToPascalCase(text) {
  return toPascalCase({ text: text, separator: '_' });
}

export function fromKebabToPascalCase(text) {
  return toPascalCase({ text: text, separator: '-' });
}

function fromPascal({ text, joiner }) {
  const prefixPattern = new RegExp(`^([$_-]*)`);
  const suffixPattern = new RegExp(`([$_-]*)$`);

  let string = text;
  let prefix = string.match(prefixPattern)[1];
  let suffix = string.match(suffixPattern)[1];
  let result = prefix;

  string = string.replace(prefixPattern, '').replace(suffixPattern, '');

  do {
    let position = string.search(/[^A-Z$_-][A-Z]/);
    if (position === -1) break;
    ++position;
    string = string
      .substr(0, position)
      .concat(joiner)
      .concat(string.charAt(position).toLowerCase())
      .concat(string.substr(position + 1));
  } while (true);
  string = string.toLowerCase();

  result += string;
  result += suffix;

  return result;
}

export function fromPascalToSnakeCase(text) {
  return fromPascal({ text: text, joiner: '_' });
}

export function fromPascalToKebabCase(text) {
  return fromPascal({ text: text, joiner: '-' });
}

export default {
  getBrowser,
  isMobile,
  increaseBadgeCount,
  setBadgeText,
  getBadgeText,
  createNotification,
  clearNotification,
  getStorage,
  setStorage,
  removeStorage,
  queryTab,
  currentTab,
  createTab,
  updateTab,
  removeTab,
  openDefaultPort,
  executeScript,
  logError,
  funcToStr,
  dataURItoBlob,
  extractRootDomain,
  unique,
  fromSnakeToPascalCase,
  fromKebabToPascalCase,
  fromPascalToSnakeCase,
  fromPascalToKebabCase,
};
