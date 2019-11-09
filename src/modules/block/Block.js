/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

/**
 * HTTP Request blocker module
 */
import config from '../../common/Config';
const { PROJECT_PREFIX, ID_PREFIX, PROJECT_DOMAIN } = config;

import { executeScript } from '../../common/Utils';
import Context from '../../common/Context';

// Shorten value to improve performance
const SHORTEN_LENGTH = 0x10;

// Store private datas
let privateData = {};
// Re-use buffer
// Stack pop() is faster than shift()
let recycleStack = [];
// Unique element id
let elementId = 0;
// Request may be cancelled
let sensitives = [];

/**
 * Prepend inline script to header
 */
function patch({ tabId, id, code }) {
  if (!Context.get('enabled') || !Context.get('block_enabled')) return;
  executeScript({
    details: {
      allFrames: true,
      code: `
      (function() {
        var exists = document.getElementById('${id}');
        if (exists) return;
        var s = document.createElement('script');
        s.id = '${id}';
        s.innerHTML = \`${code}\`;
        document.head.prepend(s);
      })();
      `,
    },
  });
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
  if (!Context.get('enabled') || !Context.get('block_enabled')) return;
  executeScript({
    tabId: tabId,
    details: {
      // Check all frames (e.g. iframe, frame)
      allFrames: true,
      code: `
      (function() {
        var id = ${elementId};
        var handler = function(elementId) {
          return function(e) {
            var value;
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
            var port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
            port.postMessage({
              id: elementId,
              type: 'update_data',
              key: ${tabId},
              data: value
            });
          };
        };

        var port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
        var key = ${tabId};
        // Target elements
        var target = 'input[type=password]';
        var iterable = [];
        var pwFields = Array.from(
          document.querySelectorAll(target)
        );

        iterable = iterable.concat(pwFields);
        var pwForms = [].filter.call(document.querySelectorAll('form'),
          function(el) {
            return el.querySelector(target) ? el : null;
          }
        );

        iterable = iterable.concat(pwForms);
        for (var i = 0; i < iterable.length; ++i) {
          id++;
          port.postMessage({
            id: id,
            type: 'update_id'
          });

          var el = iterable[i];
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
      })();`,
    },
  });
}

// Create translucent black background when alert appears
function createBg() {
  executeScript({
    details: {
      code: `
      (function() {
        var bg = document.createElement('div');
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
  });
}

// Remove background which created by createBg()
function removeBg() {
  executeScript({
    details: {
      code: `
      (function() {
        var bg = document.getElementById('${ID_PREFIX}bg');
        bg.parentElement.removeChild(bg);
      })()`,
    },
  });
}

function enforceUpdate() {
  onUpdated();
  chrome.tabs.reload(undefined, { bypassCache: true });
}

export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      case 'update_toggle':
      case 'update_options':
        // Force trigger updated
        if (message.data) enforceUpdate();
        break;
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
      // Case when element id updated
      case 'update_id': {
        if (message.id > elementId) {
          console.log(elementId);
          elementId = message.id;
        }
        break;
      }
      // Ask background to create translucent background
      case 'create_background': {
        createBg();
        break;
      }
      case 'remove_background': {
        removeBg();
        break;
      }
      default:
        console.log(message);
        break;
    }
  });
}

export function onUpdated(tabId, changeInfo, tab) {
  if (!Context.get('enabled') || !Context.get('block_enabled')) return;
  console.log(tabId, changeInfo, tab);

  // Delete previous page informations
  del(tabId);

  // Bind once per tab
  bind(tabId);

  // Patch xhr
  executeScript({
    details: {
      code: `
      (function() {
        var port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
        port.onMessage.addListener(function(message) {
          if (message.type === 'update_context') {
            window.postMessage(message.data, "*");
          }
        });
        port.postMessage({
          type: 'retrieve_context'
        });
      })();
      `,
    },
  });

  patch({
    tabId: tabId,
    id: `${ID_PREFIX}xhrpatch`,
    code: `
    (function() {
      var context = {};
      window.addEventListener("message", function(event) {
        if (event.data) {
          try {
            context = JSON.parse(event.data);
          } catch (e) {}
        }
      }, false);

      var createBg = function() {
        var port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
        port.postMessage({
          type: 'create_background'
        });
      };
      var removeBg = function() {
        var port = chrome.runtime.connect({name: "${PROJECT_PREFIX}"});
        port.postMessage({
          type: 'remove_background'
        });
      };


      var open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        var method = arguments[0];
        var action = arguments[1];

        if (!action.match(/^https?:/i)) {
          var dummy = document.createElement('a');
          dummy.href = action;
          // Assign absolute url
          action = dummy.href;
        }

        if (method.match(/^POST$/i) && action.match(/^http:/i)) {
          var send = this.send;
          this.send = function(body) {
            var isSensitive = false;
            try {
              var targets = document.querySelectorAll('input[type=password]');
              for (var i = 0; i < targets.length; ++i) {
                if (context.plainText && body.indexOf(targets[i].value) !== -1) {
                  createBg();
                  if (confirm("${chrome.i18n
                    .getMessage('confirm_request_block')
                    .replace(/\n/g, '\\\\n')}")) {;
                    isSensitive = true;
                    removeBg();
                    break;
                  } else {
                    alert("${chrome.i18n.getMessage('request_blocked').replace(/\n/g, '\\\\n')}")
                    removeBg();
                    // Cancel request
                    return;
                  }
                }
              }
            } catch (e) {}
            // Inject header
            if (isSensitive) {
              this.setRequestHeader("X-Plaintext-Login", "GRANTED");
            }
            // Call original send method
            try {
              send.call(this, body);
            } catch (e) {
              console.error(e);
            }
          };
        }
        open.apply(this, [method, action]);
      };
    })();
  `,
  });
}

export function onRemoved(tabId, removed) {
  if (!Context.get('enabled') || !Context.get('block_enabled')) return;
  // Remove private data by tab id when tab closed
  del(tabId);
}

/*
 * Check HTTP POST Body data contains plain private data
 */
export function onBeforeRequest(details) {
  if (!Context.get('enabled') || !Context.get('block_enabled')) return;
  if (details.method === 'POST' && details.requestBody) {
    const url = new URL(details.url);
    // If host is IPv4 range
    const hostname = url.hostname;
    /**
     * Check if hostname is in private ip range
     */
    // If hostname only contains non-dot characters
    // e.g.) localhost, broadcasthost
    if (hostname.match(/^[a-z0-9-_]$/i)) return;
    // Case when ip only contains numeric chracters
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
      if (hostname.match(ruleset)) return;
    }
    if (!privateData[details.tabId]) {
      return;
    }
    let keys = Object.keys(privateData[details.tabId]);
    // Skip when no keys
    if (keys.length === 0) {
      return;
    }
    let isSensitive = false;
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
              isSensitive = true;
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
            isSensitive = true;
            break first;
          }
        }
      }
    }
    // If formData or rawData contains plain private data
    if (isSensitive) {
      sensitives.push(details.requestId);
    }
    del(details.tabId);
  }
}

/**
 * Block request before send headers
 */
export function onBeforeSendHeaders(details) {
  if (sensitives.includes(details.requestId)) {
    if (details.requestHeaders) {
      const headers = details.requestHeaders;
      for (let i = 0; i < headers.length; ++i) {
        if (headers[i].name === 'X-Plaintext-Login') {
          if (headers[i].value === 'GRANTED') return;
        }
      }
    }

    createBg();
    if (!confirm(chrome.i18n.getMessage('confirm_request_block'))) {
      alert(chrome.i18n.getMessage('request_blocked'));
      removeBg();

      return { cancel: true };
    }
    removeBg();
  }
}

export function onCompleted(details) {
  if (sensitives.includes(details.requestId)) {
    let index = sensitives.indexOf(details.requestId);
    sensitives.splice(index, 1);
  }
}

export function onErrorOccurred(details) {
  console.log(details);
  if (details.error === 'net::ERR_BLOCKED_BY_CLIENT' && details.type.slice(-5) === 'frame') {
    if (sensitives.includes(details.requestId)) {
      chrome.tabs.reload(details.tabId, { bypassCache: true });
    }
  }
}

export default {
  onConnect,
  onUpdated,
  onRemoved,
  onBeforeRequest,
  onBeforeSendHeaders,
  onCompleted,
  onErrorOccurred,
};
