/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import Security from './Security';

// Security module
chrome.tabs.onUpdated.addListener(Security.onUpdated);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Security.onBeforeSendHeaders,
  { urls: ['*://*/*'] },
  ['requestHeaders', 'extraHeaders', 'blocking']
);
