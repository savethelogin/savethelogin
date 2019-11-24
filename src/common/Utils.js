/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '@/common/Config';
const { PROJECT_PREFIX } = config;

import dat from './public_suffix_list.dat';
const suffixes = dat.split('\n').filter(line => {
  return !(line.substr(0, 2) === '//' || !line.trim());
});

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

export function isMobile() {
  if (typeof navigator === 'object') {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      return true;
    }
  }
  return false;
}

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

export function clearNotification(notificationId = undefined) {
  return new Promise((resolve, reject) => {
    chrome.notifications.clear(notificationId, wasCleared => {
      promiseHandler({ resolve: resolve, reject: reject }, wasCleared);
    });
  });
}

export function getStorage({ area = 'local', keys = null }) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].get(keys, items => {
      promiseHandler({ resolve: resolve, reject: reject }, items);
    });
  });
}

export function setStorage({ area = 'local', items }) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].set(items, () => {
      promiseHandler({ resolve: resolve, reject: reject });
    });
  });
}

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

export function queryTab(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, result => {
      promiseHandler({ resolve: resolve, reject: reject }, result);
    });
  });
}

export function currentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.getCurrent(tab => {
      promiseHandler({ resolve: resolve, reject: reject }, tab);
    });
  });
}

export function createTab(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, tab => {
      promiseHandler({ resolve: resolve, reject: reject }, tab);
    });
  });
}

export function updateTab({ tabId = undefined, updateProperties }) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, tab => {
      promiseHandler({ resolve: resolve }, tab);
    });
  });
}

export function removeTab(tabIds) {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabIds, () => {
      promiseHandler({ resolve: resolve, reject: reject });
    });
  });
}

export function openDefaultPort() {
  return chrome.runtime.connect({ name: `${PROJECT_PREFIX}` });
}

export function executeScript({ tabId = undefined, details }) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, details, results => {
      promiseHandler({ resolve: resolve, reject: reject }, results);
    });
  }).catch(logError);
}

export function logError(e) {
  if (chrome.runtime.lastError) {
    console.log(e, chrome.runtime.lastError);
  } else {
    console.log(e);
  }
}

export function funcToStr(func) {
  if (typeof func !== 'function') throw new Error('func is not a function');
  return func.toString().replace(/^function\s\w*\(.*?\)\s\{(.*)\}$/s, '$1');
}

// https://stackoverflow.com/a/12300351
export function dataURItoBlob(dataURI) {
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

export function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}

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
