/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

/**
 * HTTP Request blocker module
 **/
import config from './Config';
const { PROJECT_PREFIX, ID_PREFIX, PROJECT_DOMAIN, SHORTEN_LENGTH } = config;

import { logError } from '../utils/Util';
import Context from './Context';

// Store private datas
let privateData = {};
// Re-use buffer
// Stack pop() is faster than shift()
let recycleStack = [];
// Unique element id
let elementId = 0;

function patch({ tabId, id, code }) {
  if (!Context.enabled || !Context.plainText) return;
  chrome.tabs.executeScript(
    tabId,
    {
      allFrames: true,
      code: `
      (function(window, document) {
        let exists = document.getElementById('${id}');
        if (exists) return;
        let s = document.createElement('script');
        s.id = '${id}';
        s.innerHTML = \`${code}\`;
        document.head.prepend(s);
      })(window, document);
      `,
    },
    logError
  );
}

// Unset and zero-fill to erase sensitive datas
function del(tabId) {
  if (privateData[tabId] === undefined) return;
  Object.keys(privateData[tabId]).forEach(key => {
    // Zero-fill
    privateData[tabId][key].fill(0);
    console.log('buffer erased');
    recycleStack.push(privateData[tabId][key]);

    privateData[tabId][key] = undefined;
  });
  privateData[tabId] = undefined;
}

// Bind event handler to webpage
function bind(tabId) {
  if (!Context.enabled || !Context.plainText) return;
  chrome.tabs.executeScript(
    tabId,
    {
      // Check all frames (e.g. iframe, frame)
      allFrames: true,
      code: `
      (function(window, document) {
        let id = ${elementId};
        let handler = function(elementId) {
          return function(e) {
            let value;
            switch (e.type) {
            case 'change':
              value = e.target.value;
              break;
            case 'submit':
              // Iterate form input elements
              Array.from(e.target.elements).some(function(el) {
                if (el.type === 'password') {
                  value = el.value;
                  return true;
                }
              });
              break;
            }
            // Send event to extension
            let port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
            port.postMessage({
              id: elementId,
              type: 'update_data',
              key: ${tabId},
              data: value
            });
          };
        };
        let port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
        const key = ${tabId};
        // Target elements
        const target = 'input[type=password]';
        let iterable = [];
        let pwFields = Array.from(
          document.querySelectorAll(target)
        );
        iterable = iterable.concat(pwFields);
        let pwForms = [].filter.call(document.querySelectorAll('form'),
          function(el) {
            return el.querySelector(target) ? el : null;
          }
        );
        iterable = iterable.concat(pwForms);
        for (let i = 0; i < iterable.length; ++i) {
          id++;
          port.postMessage({
            id: id,
            type: 'update_id'
          });

          let el = iterable[i];
          switch (el.tagName.toLowerCase()) {
          case 'input':
            el.addEventListener("change", handler(id));
            break;
          case 'form':
            el.addEventListener("submit", handler(id));
            break;
          default:
            break;
          }
        }
        // Add xhr listener
        window.addEventListener("message", function(event) {
          if (event.source != window) return;
          if (event.data && event.data === "${PROJECT_PREFIX}_xhr") {
            let port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
            port.postMessage({
              type: 'trigger_request',
              key: ${tabId},
            });
          }
        }, false);
      })(window, document);`,
    },
    logError
  );
}

// Create translucent black background when alert appears
function createBg() {
  chrome.tabs.executeScript(
    {
      code: `
      (function() {
        let bg = document.createElement('div');
        bg.style.background = '#000';
        bg.style.opacity = '0.8';
        bg.style.width = '100%';
        bg.style.height = '100%';
        bg.style.position = 'absolute';
        bg.style.zIndex = '2147483647';
        bg.style.top = '0';
        bg.style.left = '0';
        bg.id = '${ID_PREFIX}bg';
        document.body.appendChild(bg);
      })()`,
    },
    logError
  );
}

// Remove background which created by createBg()
function removeBg() {
  chrome.tabs.executeScript(
    {
      code: `
      (function() {
        let bg = document.getElementById('${ID_PREFIX}bg');
        bg.parentElement.removeChild(bg);
      })()`,
    },
    logError
  );
}

export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      // Case when data updated by event listener
      case 'update_data': {
        if (!message.data) return;
        let tmp = new Uint8Array(
          message.data
            .toString()
            .slice(0, SHORTEN_LENGTH)
            .split('')
            .map(c => c.charCodeAt(0))
        );
        // Assign new object if undefined
        if (privateData[message.key] === undefined) {
          privateData[message.key] = {};
        }
        if (privateData[message.key][message.id] === undefined) {
          // Re-use typed array from stack if available
          if (recycleStack.length > 0) {
            console.log('Buffer recycled');
            privateData[message.key][message.id] = recycleStack.pop();
          } else {
            console.log('Buffer created');
            privateData[message.key][message.id] = new Uint8Array(SHORTEN_LENGTH);
          }
          // Initialize array
          privateData[message.key][message.id].fill(0);
        }
        privateData[message.key][message.id].set(tmp);

        // Unset after setting
        tmp.fill(0);
        tmp = undefined;
        break;
      }
      // Case when toggle on/off button changed
      case 'update_toggle': {
        Context.enabled = message.data;
        if (Context.enabled === true)
          chrome.browserAction.setIcon({
            path: '/icons/icon16.png',
          });
        else
          chrome.browserAction.setIcon({
            path: '/icons/icon-off16.png',
          });
        // Force trigger updated
        onUpdated();
        break;
      }
      // Case when option changed
      case 'update_options': {
        switch (message.name) {
          case 'plain_text':
            Context.plainText = message.data;
            break;
          case 'session_hijack':
            Context.sessHijack = message.data;
            break;
          default:
            break;
        }
        onUpdated();
        break;
      }
      // Case when element id updated
      case 'update_id': {
        if (message.id > elementId) {
          console.log(elementId);
          elementId = message.id;
        }
        break;
      }
      // Case when xhr send triggered
      case 'trigger_request': {
        chrome.tabs.executeScript(message.key, {
          allFrames: true,
          code: `
            (function(window, document) {
              let id = ${elementId};
              let port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});

              const target = 'input[type=password]';
              let iterable = [];
              let pwFields = Array.from(
                document.querySelectorAll(target)
              );
              iterable = iterable.concat(pwFields);
              for (let i = 0; i < iterable.length; ++i) {
                id++;
                port.postMessage({
                  id: id,
                  type: 'update_data',
                  key: ${message.key},
                  data: iterable[i].value
                });
              }
            })(window, document);
            `,
        });
        break;
      }
      default:
        console.error(message);
        break;
    }
  });
}

export function onUpdated(tabId, changeInfo, tab) {
  console.log('yes', Context.plainText);
  if (!Context.enabled || !Context.plainText) return;
  console.log(tabId, changeInfo, tab);
  // Delete previous page informations
  del(tabId);
  // Bind once per tab
  bind(tabId);
  // Patch xhr
  patch({
    tabId: tabId,
    id: `${ID_PREFIX}xhrpatch`,
    code: `
    (function() {
      var send = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.send = function(body) {
        window.postMessage("${PROJECT_PREFIX}_xhr", "*");
        try {
          send.call(this, body);
        } catch (e) {
          console.error(e);
        }
      };
    })();
  `,
  });
}

export function onRemoved(tabId, removed) {
  if (!Context.enabled || !Context.plainText) return;
  // Remove HTTP response headers record
  chrome.storage.local.remove([`${PROJECT_PREFIX}_tab_` + tabId], () => {});
  // Remove private data by tab id when tab closed
  del(tabId);
}

/*
 * Check HTTP POST Body data contains plain private data
 */
export function onBeforeRequest(details) {
  if (!Context.enabled || !Context.plainText) return {};
  if (details.method === 'POST' && details.requestBody) {
    const url = new URL(details.url);
    // If host is IPv4 range
    const hostname = url.hostname;
    // Check if hostname is in private ip range
    if (hostname.match(/^localhost$/i)) return {};
    if (hostname.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})$/)) {
      const privateIpRange = [
        // 127.0.0.1
        /127\.0\.0\.1/,
        // 0.0.0.0
        /0\.0\.0\.0/,
        // 10.0.0.0 – 10.255.255.255
        /10\.(2[0-5][0-5]|1[0-9][0-9]|[1-9][0-9]|[0-9])/,
        // 172.16.0.0 – 172.31.255.255
        /172\.(1[6-9]|2[0-9]|3[0-1])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])/,
        // 192.168.0.0 – 192.168.255.255
        /192\.168\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])/,
      ];
      // Create filter by priv_range
      const ruleset = new RegExp('^' + privateIpRange.map(x => x.source).join('|') + '$');
      if (hostname.match(ruleset)) return {};
    }
    if (!privateData[details.tabId]) {
      return {};
    }
    let keys = Object.keys(privateData[details.tabId]);
    // Skip when no keys
    if (keys.length === 0) {
      return {};
    }
    let flag = false;
    first: for (let i = 0; i < keys.length; ++i) {
      const formData = details.requestBody.formData;
      if (formData) {
        for (let name in formData) {
          for (let j = 0; j < formData[name].length; ++j) {
            // Convert string to Uint8Array
            const u8a = new Uint8Array(
              formData[name][j]
                .toString()
                .slice(0, SHORTEN_LENGTH)
                .split('')
                .map(c => c.charCodeAt(0))
            );
            if (
              privateData[details.tabId][keys[i]]
                .filter(x => x !== 0)
                .every(val => u8a.includes(val))
            ) {
              flag = true;
              break first;
            }
          }
        }
      }
      const rawData = details.requestBody.raw;
      if (rawData) {
        for (let j = 0; j < rawData.length; ++j) {
          // Convert rawData to Uint8Array
          const u8a = new Uint8Array(rawData[j].bytes);
          if (
            privateData[details.tabId][keys[i]].filter(x => x !== 0).every(val => u8a.includes(val))
          ) {
            flag = true;
            break first;
          }
        }
      }
    }
    // If formData or rawData contains plain private data
    if (flag) {
      createBg();
      if (!confirm(chrome.i18n.getMessage('confirm_request_block'))) {
        alert(chrome.i18n.getMessage('request_blocked'));
        removeBg();
        // Surpress block error page
        return { redirectUrl: 'javascript:' };
      }
      removeBg();
    }
    del(details.tabId);
  }
  return {};
}

/*
 * Store HTTP Response headers
 */
export function onResponseStarted(details) {
  if (!Context.enabled) return;
  if (details.statusCode === 200) {
    // If response type is not subframe
    if (details.type === 'main_frame') {
      // Store http reponse to local storage
      chrome.storage.local.set({
        [`${PROJECT_PREFIX}_tab_${details.tabId}`]: details,
      });
    }
  }
}

export default {
  onConnect: onConnect,
  onUpdated: onUpdated,
  onRemoved: onRemoved,
  onBeforeRequest: onBeforeRequest,
  onResponseStarted: onResponseStarted,
};