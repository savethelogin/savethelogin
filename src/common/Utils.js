/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from './Config';
const { PROJECT_PREFIX } = config;

export function getBrowser() {
  if (typeof whale === 'object') {
    return { name: 'whale', scheme: 'whale-extension', browser: whale };
  } else if (typeof browser === 'object') {
    return { name: 'browser', scheme: 'moz-extension', browser: browser };
  } else if (typeof chrome === 'object') {
    return { name: 'chrome', scheme: 'chrome-extension', browser: chrome };
  } else {
    throw new Error('browser is unknown');
  }
}
export const browser = getBrowser().browser;

function promiseHandler(
  {
    resolve,
    reject = value => {
      value;
    },
  },
  value
) {
  if (browser.runtime.lastError) {
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

    browser.notifications.create(notificationId, options, id => {
      promiseHandler({ resolve: resolve, reject: reject }, id);
    });
  });
}

export function clearNotification(notificationId = undefined) {
  return new Promise((resolve, reject) => {
    browser.notifications.clear(notificationId, wasCleard => {
      promiseHandler({ resolve: resolve, reject: reject }, wasCleared);
    });
  });
}

export function getStorage({ area = 'local', keys = null }) {
  return new Promise((resolve, reject) => {
    browser.storage[area].get(keys, items => {
      promiseHandler({ resolve: resolve, reject: reject }, items);
    });
  });
}

export function setStorage({ area = 'local', items }) {
  return new Promise((resolve, reject) => {
    browser.storage[area].set(items, () => {
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
      browser.storage[area].clear(callback);
    } else {
      browser.storage[area].remove(keys, callback);
    }
  });
}

export function queryTab(queryInfo) {
  return new Promise((resolve, reject) => {
    browser.tabs.query(queryInfo, result => {
      promiseHandler({ resolve: resolve, reject: reject }, result);
    });
  });
}

export function createTab(createProperties) {
  return new Promise((resolve, reject) => {
    browser.tabs.create(createProperties, tab => {
      promiseHandler({ resolve: resolve, reject: reject }, tab);
    });
  });
}

export function updateTab({ tabId = undefined, updateProperties }) {
  return new Promise((resolve, reject) => {
    browser.tabs.update(tabId, updateProperties, tab => {
      promiseHandler({ resolve: resolve }, tab);
    });
  });
}

export function openDefaultPort() {
  return browser.runtime.connect({ name: `${PROJECT_PREFIX}` });
}

export function executeScript({ tabId = undefined, details }) {
  return new Promise((resolve, reject) => {
    browser.tabs.executeScript(tabId, details, results => {
      promiseHandler({ resolve: resolve, reject: reject }, results);
    });
  }).catch(logError);
}

export function logError(e) {
  if (browser.runtime.lastError) {
    console.log(e, browser.runtime.lastError);
  } else {
    console.log(e);
  }
}

export function funcToStr(func) {
  if (typeof func !== 'function') throw new Error('func is not a function');
  return func.toString().replace(/^function\s\w*\(.*?\)\s\{(.*)\}$/s, '$1');
}

export default {
  getBrowser,
  browser,
  createNotification,
  clearNotification,
  getStorage,
  setStorage,
  removeStorage,
  queryTab,
  createTab,
  updateTab,
  openDefaultPort,
  executeScript,
  logError,
  funcToStr,
};
