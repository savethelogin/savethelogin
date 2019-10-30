/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../../classes/Config';
import Context from '../../classes/Context';
import Block from './Block';

const { PROJECT_PREFIX } = config;
const defaultEnabled = true;

chrome.storage.sync.get([`${PROJECT_PREFIX}_opt_block_enabled`], items => {
  if (items[`${PROJECT_PREFIX}_opt_block_enabled`] === undefined) {
    chrome.storage.sync.set({
      [`${PROJECT_PREFIX}_opt_block_enabled`]: defaultEnabled,
    });
    Context.set('block_enabled', defaultEnabled);
  } else {
    Context.set('block_enabled', items[`${PROJECT_PREFIX}_opt_block_enabled`]);
  }
});

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
chrome.webRequest.onCompleted.addListener(Block.onCompleted, {
  urls: ['https://*/*', 'http://*/*'],
});
chrome.webRequest.onErrorOccurred.addListener(Block.onErrorOccurred, {
  urls: ['https://*/*', 'http://*/*'],
});
