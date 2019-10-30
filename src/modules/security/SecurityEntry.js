/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../../classes/Config';
import Context from '../../classes/Context';
import Security from './Security';

const { PROJECT_PREFIX } = config;
const defaultEnabled = false;

const optionKey = `${PROJECT_PREFIX}_opt_security_enabled`;

chrome.storage.sync.get([optionKey], items => {
  if (items[optionKey] === undefined) {
    chrome.storage.sync.set({
      [optionKey]: defaultEnabled,
    });
    Context.set('security_enabled', defaultEnabled);
  } else {
    Context.set('security_enabled', items[optionKey]);
  }
});

// Security module
chrome.tabs.onUpdated.addListener(Security.onUpdated);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Security.onBeforeSendHeaders,
  { urls: ['*://*/*'] },
  ['requestHeaders', 'extraHeaders', 'blocking']
);
