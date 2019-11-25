/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '@/common/Config';
import Context from '@/common/Context';
import { getBrowser, getStorage, setStorage } from '@/common/Utils';
import Block from './Block';

const { PROJECT_PREFIX } = config;
const defaultEnabled = true;

const prefix = 'block';
const optionKey = `${PROJECT_PREFIX}_opt_${prefix}_enabled`;

getStorage({
  area: 'sync',
  keys: [optionKey, `${prefix}_whitelist`],
}).then(items => {
  if (items[optionKey] === undefined) {
    setStorage({
      area: 'sync',
      items: {
        [optionKey]: defaultEnabled,
      },
    });
    Context.set(`${prefix}_enabled`, defaultEnabled);
  } else {
    Context.set(`${prefix}_enabled`, items[optionKey]);
    Context.set(`${prefix}_whitelist`, items[`${prefix}_whitelist`]);
  }
});

// Blocker module
chrome.runtime.onConnect.addListener(Block.onConnect);

chrome.notifications.onClicked.addListener(Block.onClicked);

chrome.tabs.onUpdated.addListener(Block.onUpdated);
chrome.tabs.onRemoved.addListener(Block.onRemoved);

chrome.webRequest.onBeforeRequest.addListener(Block.onBeforeRequest, { urls: ['http://*/*'] }, [
  'requestBody',
]);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Block.onBeforeSendHeaders,
  { urls: ['http://*/*'] },
  Array.prototype.slice.apply(
    ['blocking', 'requestHeaders', 'extraHeaders'],
    getBrowser() !== 'firefox' ? [] : [0, -1]
  )
);
chrome.webRequest.onCompleted.addListener(Block.onCompleted, {
  urls: ['https://*/*', 'http://*/*'],
});
chrome.webRequest.onErrorOccurred.addListener(Block.onErrorOccurred, {
  urls: ['https://*/*', 'http://*/*'],
});
