/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../classes/Config';
const { PROJECT_PREFIX } = config;

export function openDefaultPort() {
  return chrome.runtime.connect({ name: `${PROJECT_PREFIX}` });
}

export function executeScript({ tabId = undefined, details }) {
  console.log(tabId, details);
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, details, results => {
      if (chrome.runtime.lastError) {
        reject(results);
      } else {
        resolve(results);
      }
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
  openDefaultPort: openDefaultPort,
  executeScript: executeScript,
  logError: logError,
  funcToStr: funcToStr,
};
