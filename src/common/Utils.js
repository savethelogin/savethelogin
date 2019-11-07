/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from './Config';
const { PROJECT_PREFIX } = config;

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

export function openDefaultPort() {
  return chrome.runtime.connect({ name: `${PROJECT_PREFIX}` });
}

export function executeScript({ tabId = undefined, details }) {
  console.log(tabId, details);
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

export default {
  getStorage: getStorage,
  setStorage: setStorage,
  removeStorage: removeStorage,
  queryTab: queryTab,
  createTab: createTab,
  updateTab: updateTab,
  openDefaultPort: openDefaultPort,
  executeScript: executeScript,
  logError: logError,
  funcToStr: funcToStr,
};