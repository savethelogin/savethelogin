/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '@/common/Config';
import Context from '@/common/Context';
import { getBrowser, getStorage, setStorage } from '@/common/Utils';
import Security from './Security';

const { PROJECT_PREFIX } = config;
const defaultEnabled = false;

const optionKey = `${PROJECT_PREFIX}_opt_security_enabled`;

getStorage({ area: 'sync', keys: [optionKey] }).then(items => {
  if (items[optionKey] === undefined) {
    setStorage({
      area: 'sync',
      items: {
        [optionKey]: defaultEnabled,
      },
    });
    Context.set('security_enabled', defaultEnabled);
  } else {
    Context.set('security_enabled', items[optionKey]);
  }
});

// Security module
chrome.tabs.onUpdated.addListener(Security.onUpdated);
chrome.tabs.onRemoved.addListener(Security.onRemoved);
chrome.webRequest.onErrorOccurred.addListener(Security.onErrorOccurred, {
  urls: ['*://*/*'],
});
chrome.webRequest.onBeforeRequest.addListener(Security.onBeforeRequest, { urls: ['*://*/*'] }, [
  'requestBody',
  'blocking',
]);
chrome.webRequest.onBeforeSendHeaders.addListener(
  Security.onBeforeSendHeaders,
  { urls: ['*://*/*'] },
  Array.prototype.slice.apply(
    ['blocking', 'requestHeaders', 'extraHeaders'],
    getBrowser() !== 'firefox' ? [] : [0, -1]
  )
);
