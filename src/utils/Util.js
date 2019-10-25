/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

export function logError(e) {
  if (chrome.runtime.lastError) {
    console.log(e, chrome.runtime.lastError);
  } else {
    console.log(e);
  }
}
