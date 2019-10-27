/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

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

export default {
  executeScript: executeScript,
  logError: logError,
};
