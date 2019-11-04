/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import config from '../../classes/Config';
import Context from '../../classes/Context';
import { removeStorage, setStorage } from '../../classes/Utils';

const { PROJECT_PREFIX } = config;

export function onRemoved(tabId, removed) {
  // Remove HTTP response headers record
  removeStorage({ keys: [`${PROJECT_PREFIX}_tab_` + tabId] });
}

/**
 * Store HTTP Response headers
 */
export function onResponseStarted(details) {
  if (!Context.get('enabled')) return;
  if (details.statusCode === 200) {
    // If response type is not subframe
    if (details.type === 'main_frame') {
      // Store http reponse to local storage
      setStorage({
        items: {
          [`${PROJECT_PREFIX}_tab_${details.tabId}`]: details,
        },
      });
    }
  }
}

export default {
  onRemoved: onRemoved,
  onResponseStarted: onResponseStarted,
};
