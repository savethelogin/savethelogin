/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from './classes/Config';
import Context from './classes/Context';
import { getStorage, setStorage } from './classes/Utils';

const { PROJECT_PREFIX } = config;

/**
 * Import modules
 */
const cache = {};
const requireModules = require.context('./modules/', true, /[A-Za-z]*Entry\.js$/);

/* https://webpack.js.org/guides/dependency-management/#require-context */
function importAll(r) {
  r.keys().forEach(key => (cache[key] = r(key)));
}

// Import every module not start with underscore
importAll(requireModules);
console.log('cache', cache);

const loadedModules = requireModules.keys().map(key =>
  key
    .split('/')
    .slice(-2)[0]
    .toLowerCase()
);
console.log(loadedModules);

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
});

chrome.runtime.onConnect.addListener(onConnect);

export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      // Case when toggle on/off button changed
      case 'update_toggle': {
        Context.set('enabled', message.data);
        if (Context.get('enabled') === true)
          chrome.browserAction.setIcon({
            path: '/icons/icon16.png',
          });
        else
          chrome.browserAction.setIcon({
            path: '/icons/icon-off16.png',
          });
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
      default:
        console.log(message);
        break;
    }
  });
}
