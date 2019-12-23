/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

/**
 * @file Entry of background scripts
 */
import config from '@/common/Config';
import Context from '@/common/Context';
import {
  clearBadgeCount,
  getStorage,
  setStorage,
  dataURItoBlob,
  fromPascalToSnakeCase,
} from '@/common/Utils';

const { PROJECT_PREFIX } = config;

// Import modules
const cache = {};
const requireModules = require.context('./modules/', true, /[A-Za-z]*Entry\.js$/);

/* https://webpack.js.org/guides/dependency-management/#require-context */
function importAll(r) {
  r.keys().forEach(key => (cache[key] = r(key)));
}

// Import every module not start with underscore
importAll(requireModules);
console.log('cache', cache);

const loadedModules = requireModules.keys().map(key => {
  const start = key.lastIndexOf('/');
  const end = key.lastIndexOf('.');

  return fromPascalToSnakeCase(key.substring(start + 1, end).slice(0, 'Entry'.length * -1));
});
console.log(loadedModules);
Context.set('loaded_modules', loadedModules);

// Check extension disabled
getStorage({ area: 'sync', keys: [`${PROJECT_PREFIX}_disabled`] }).then(items => {
  if (items[`${PROJECT_PREFIX}_disabled`] === undefined) {
    setStorage({
      area: 'sync',
      items: {
        [`${PROJECT_PREFIX}_disabled`]: false,
      },
    });
  }
  Context.set('enabled', !!!items[`${PROJECT_PREFIX}_disabled`] ? true : false);
  setIcon(Context.get('enabled'));
});

/**
 * Set shortcut icon active/disabled by state.
 * @param {Boolean} isEnabled - State of extension.
 */
function setIcon(isEnabled) {
  if (isEnabled === true) {
    chrome.browserAction.setIcon({
      path: '/icons/icon16.png',
    });
  } else {
    chrome.browserAction.setIcon({
      path: '/icons/icon-off16.png',
    });
  }
}

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {
  urls: ['http://*/*', 'https://*/*'],
});

export function onBeforeSendHeaders(details) {
  if (details.type === 'main_frame') {
    // Reset previous count
    clearBadgeCount(details.tabId);
  }
}

chrome.runtime.onConnect.addListener(onConnect);

/** Common runtime connection handler */
export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      // Case when toggle on/off button changed
      case 'update_toggle': {
        Context.set('enabled', message.data);
        setIcon(Context.get('enabled'));
        break;
      }
      // Case when option changed
      case 'update_options': {
        let oldValue = Context.get(message.name);
        Context.set(message.name, message.data);
        if (oldValue != message.data) {
          port.postMessage({
            type: 'update_context',
            data: Context.serialize(),
          });
        }
        break;
      }
      // Pass background context object to port
      case 'retrieve_context': {
        port.postMessage({
          type: 'update_context',
          data: Context.serialize(),
        });
        break;
      }
      // browser.downloads.download will not work on content script
      case 'download_firefox': {
        let blob = dataURItoBlob(message.data.url);
        message.data.url = URL.createObjectURL(blob);
        chrome.downloads.download(message.data);
        break;
      }
      default:
        console.log(message);
        break;
    }
  });
}
