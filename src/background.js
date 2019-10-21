/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import config from './classes/Config';
const { PROJECT_PREFIX } = config;

import Context from './classes/Context';
import Block from './classes/Block';

// Check extension disabled
chrome.storage.sync.get([`${PROJECT_PREFIX}_disabled`], items => {
  const item = items[`${PROJECT_PREFIX}`];
  if (item === undefined) Context.enabled = true;
  else Context.enabled = item;
});

/*
 * Add listeners
 */
chrome.runtime.onConnect.addListener(Block.onConnect);

chrome.tabs.onUpdated.addListener(Block.onUpdated);
chrome.tabs.onRemoved.addListener(Block.onRemoved);

chrome.webRequest.onBeforeRequest.addListener(Block.onBeforeRequest, { urls: ['http://*/*'] }, [
  'blocking',
  'requestBody',
]);
chrome.webRequest.onResponseStarted.addListener(
  Block.onResponseStarted,
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
