/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../../common/Config';
import Context from '../../common/Context';
import { getStorage, setStorage } from '../../common/Utils';
import Block from './Block';

const { PROJECT_PREFIX } = config;
const defaultEnabled = true;

const optionKey = `${PROJECT_PREFIX}_opt_block_enabled`;

getStorage({ area: 'sync', keys: [optionKey] }).then(items => {
  if (items[optionKey] === undefined) {
    setStorage({
      area: 'sync',
      items: {
        [optionKey]: defaultEnabled,
      },
    });
    Context.set('block_enabled', defaultEnabled);
  } else {
    Context.set('block_enabled', items[optionKey]);
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
