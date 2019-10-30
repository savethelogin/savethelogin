/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import config from './classes/Config';
const { PROJECT_PREFIX } = config;

import Context from './classes/Context';

import Block from './classes/Block';
import Security from './classes/Security';

// Check extension disabled
chrome.storage.sync.get(
  [
    `${PROJECT_PREFIX}_disabled`,
    `${PROJECT_PREFIX}_opt_plain_text`,
    `${PROJECT_PREFIX}_opt_session_hijack`,
  ],
  items => {
    Context.enabled = !items[`${PROJECT_PREFIX}_disabled`] ? true : false;
    Context.plainText =
      items[`${PROJECT_PREFIX}_opt_plain_text`] ||
      items[`${PROJECT_PREFIX}_opt_plain_text`] === undefined
        ? true
        : false;
    Context.sessHijack = items[`${PROJECT_PREFIX}_opt_session_hijack`] ? true : false;
  }
);

/*
 * Add listeners
 */
// Blocker module
chrome.runtime.onConnect.addListener(Block.onConnect);
chrome.tabs.onUpdated.addListener(Block.onUpdated);
chrome.tabs.onRemoved.addListener(Block.onRemoved);
chrome.webRequest.onBeforeRequest.addListener(Block.onBeforeRequest, { urls: ['http://*/*'] }, [
  'requestBody',
]);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Block.onBeforeSendHeaders,
  { urls: ['http://*/*'] },
  ['requestHeaders', 'extraHeaders', 'blocking']
);
chrome.webRequest.onResponseStarted.addListener(
  Block.onResponseStarted,
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
chrome.webRequest.onCompleted.addListener(Block.onCompleted, {
  urls: ['https://*/*', 'http://*/*'],
});
chrome.webRequest.onErrorOccurred.addListener(Block.onErrorOccurred, {
  urls: ['https://*/*', 'http://*/*'],
});

// Security module
chrome.tabs.onUpdated.addListener(Security.onUpdated);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Security.onBeforeSendHeaders,
  { urls: ['*://*/*'] },
  ['requestHeaders', 'extraHeaders', 'blocking']
);
