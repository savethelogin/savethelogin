/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import config from '../../classes/Config';
import Context from '../../classes/Context';

const { PROJECT_PREFIX } = config;

/**
 * Store HTTP Response headers
 */
export function onResponseStarted(details) {
  if (!Context.enabled) return;
  if (details.statusCode === 200) {
    // If response type is not subframe
    if (details.type === 'main_frame') {
      // Store http reponse to local storage
      chrome.storage.local.set({
        [`${PROJECT_PREFIX}_tab_${details.tabId}`]: details,
      });
    }
  }
}

export default {
  onResponseStarted: onResponseStarted,
};
