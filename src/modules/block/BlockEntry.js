/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '../../common/Config';
import Context from '../../common/Context';
import { browser, getBrowser, getStorage, setStorage } from '../../common/Utils';
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
browser.runtime.onConnect.addListener(Block.onConnect);

browser.notifications.onClicked.addListener(Block.onClicked);

browser.tabs.onUpdated.addListener(Block.onUpdated);
browser.tabs.onRemoved.addListener(Block.onRemoved);

browser.webRequest.onBeforeRequest.addListener(Block.onBeforeRequest, { urls: ['http://*/*'] }, [
  'requestBody',
]);
browser.webRequest.onBeforeSendHeaders.addListener(
  Block.onBeforeSendHeaders,
  { urls: ['http://*/*'] },
  Array.prototype.slice.apply(
    ['blocking', 'requestHeaders', 'extraHeaders'],
    getBrowser().type !== 'gecko' ? [] : [0, -1]
  )
);
browser.webRequest.onCompleted.addListener(Block.onCompleted, {
  urls: ['https://*/*', 'http://*/*'],
});
browser.webRequest.onErrorOccurred.addListener(Block.onErrorOccurred, {
  urls: ['https://*/*', 'http://*/*'],
});
