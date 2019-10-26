/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

export function executeScript({ tabId, details }) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tabId,
      details,
      results => {
        resolve(results);
      },
      logError
    );
  });
}

export function logError(e) {
  if (chrome.runtime.lastError) {
    console.log(e, chrome.runtime.lastError);
  } else {
    console.log(e);
  }
}
