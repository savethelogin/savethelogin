/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../../classes/Config';
import Context from '../../classes/Context';
import Security from './Security';

const { PROJECT_PREFIX } = config;
const defaultEnabled = false;

chrome.storage.sync.get([`${PROJECT_PREFIX}_opt_security_enabled`], items => {
  if (items[`${PROJECT_PREFIX}_opt_security_enabled`] === undefined) {
    chrome.storage.sync.set({
      [`${PROJECT_PREFIX}_opt_security_enabled`]: defaultEnabled,
    });
    Context.set('security_enabled', defaultEnabled);
  } else {
    Context.set('security_enabled', items[`${PROJECT_PREFIX}_opt_security_enabled`]);
  }
});

// Security module
chrome.tabs.onUpdated.addListener(Security.onUpdated);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Security.onBeforeSendHeaders,
  { urls: ['*://*/*'] },
  ['requestHeaders', 'extraHeaders', 'blocking']
);
