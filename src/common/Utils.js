/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from './Config';
const { PROJECT_PREFIX } = config;

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

export function extractRootDomain(hostname) {
  // Extract original(top) domain of url
  return (hostname.match(/([a-z0-9_-]{3,}((\.[a-z]{2}){1,2}|\.[a-z]{3,}))$/i) || [''])[0].replace(
    /^www[0-9]*\./i,
    ''
  );
}

export function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}

export function fromSnakeToPascalCase(text) {
  let string = text;
  let chunks = string.split('_');
  let result = chunks[0];
  for (let i = 1; i < chunks.length; i++) {
    result += chunks[i][0].toUpperCase() + chunks[i].substring(1);
  }
  return result;
}

export function fromPascalToSnakeCase(text) {
  let string = text;
  let index = 0;
  let result = '';
  let pos = string.substring(index).search(/[A-Z]/);
  if (pos === -1) return string.toString();
  do {
    pos = string.substring(index).search(/[A-Z]/);
    result += (index ? '_' : '') + string.substring(index, pos).toLowerCase();
    index += pos;
    string = string.substring(index);
  } while (pos !== -1);
  return result;
}

export default {
  getBrowser,
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
  fromPascalToSnakeCase,
};
