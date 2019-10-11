/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

// Configurations
// Shorten value to improve performance
const SHORTEN_LENGTH = 0x10;

// Store private datas
let privateData = {};
// Re-use buffer
// Stack pop() is faster than shift()
let recycleStack = [];
// Unique element id
let elementId = 0;
// Is extenstion enabled?
let enabled = false;

// Check extension disabled
chrome.storage.sync.get(['stl_disabled'], items => {
  const item = items.stl_disabled;
  if (item === undefined) enabled = true;
  else enabled = item;
});

let del = tabId => {
  if (privateData[tabId] === undefined) return;
  Object.keys(privateData[tabId]).forEach(key => {
    // Zero-fill
    privateData[tabId][key].fill(0);
    recycleStack.push(privateData[tabId][key]);

    privateData[tabId][key] = undefined;
  });
  privateData[tabId] = undefined;
};

// Bind event handler to webpage
let bind = tabId => {
  if (!enabled) return;
  chrome.tabs.executeScript(
    {
      // Check all frames (e.g. iframe, frame)
      allFrames: true,
      code: `(function() {
      let id = 0;
      let handler = function(elementId) {
        return function(e) {
          let value;
          switch (e.type) {
          case 'keyup':
            value = e.target.value;
            break;
          case 'submit':
            Array.from(e.target.elements).some(function(el) {
              if (el.type === 'password') {
                value = el.value;
                return true;
              }
            });
            break;
          }
          let port = chrome.runtime.connect({name: "stl"});
          port.postMessage({
            id: elementId,
            type: 'update_data',
            key: ${tabId},
            data: value
          });
        };
      };
      const key = ${tabId};
      let pwFields = document.querySelectorAll("input[type=password]");
      let iterable = Array.from(pwFields);
      let pwForms = [].filter.call(document.querySelectorAll('form'),
        function(el) {
          return el.querySelector('input[type=password]') ? el : null;
        }
      );
      iterable = iterable.concat(pwForms);
      iterable.forEach(function(el) {
        switch (el.tagName.toLowerCase()) {
        case 'input':
          el.addEventListener("keyup", handler(id));
          break;
        case 'form':
          el.addEventListener("submit", handler(id));
          break;
        default:
          break;
        }
        id++;
      });
    })();`,
    },
    _ => {
      let e = chrome.runtime.lastError;
      if (e !== undefined) {
        console.log(tabId, _, e);
      }
    }
  );
};

// Create translucent black background when alert appears
let createBg = () => {
  chrome.tabs.executeScript(
    {
      code: `(function() {
    var bg = document.createElement('div');
    bg.style.background = '#000';
    bg.style.opacity = '0.8';
    bg.style.width = '100%';
    bg.style.height = '100%';
    bg.style.position = 'absolute';
    bg.style.zIndex = '2147483647';
    bg.style.top = '0';
    bg.style.left = '0';
    bg.id = '__stl__bg';
    document.body.appendChild(bg);
  })()`,
    },
    _ => {
      let e = chrome.runtime.lastError;
      if (e !== undefined) {
        console.log(_, e);
      }
    }
  );
};

// Remove background which created by createBg()
let removeBg = () => {
  chrome.tabs.executeScript(
    {
      code: `(function() {
    var bg = document.getElementById('__stl__bg');
    bg.parentElement.removeChild(bg);
  })()`,
    },
    _ => {
      let e = chrome.runtime.lastError;
      if (e !== undefined) {
        console.log(_, e);
      }
    }
  );
};

// Listen to connection created by chrome.runtime.connect()
chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name == 'stl');
  port.onMessage.addListener(message => {
    switch (message.type) {
      case 'update_data': {
        if (!message.data) return;
        let tmp = new Uint8Array(
          message.data
            .toString()
            .slice(0, SHORTEN_LENGTH)
            .split('')
            .map(c => c.charCodeAt(0))
        );
        if (privateData[message.key] === undefined) {
          privateData[message.key] = {};
        }
        if (privateData[message.key][message.id] === undefined) {
          if (recycleStack.length > 0) {
            console.log('Buffer recycled');
            privateData[message.key][message.id] = recycleStack.pop();
          } else {
            console.log('Buffer created');
            privateData[message.key][message.id] = new Uint8Array(SHORTEN_LENGTH);
          }
          privateData[message.key][message.id].fill(0);
        }
        privateData[message.key][message.id].set(tmp);

        tmp.fill(0);
        tmp = undefined;
        break;
      }
      case 'update_toggle': {
        enabled = message.data;
        break;
      }
      default:
        break;
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!enabled) return;
  del(tabId);
  // Bind once per tab
  if (changeInfo.status === 'loading') {
    bind(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removed) => {
  if (!enabled) return;
  // Remove private data by tab id when tab closed
  del(tabId);
});

/*
 * Check HTTP POST Body data contains plain private data
 */
/* jslint ignore:start */
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    if (!enabled) return;
    const url = new URL(details.url);
    if (details.method === 'POST' && details.requestBody) {
      // If host is IPv4 range
      const hostname = url.hostname;
      // Check if hostname is in private ip range
      if (hostname.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)) {
        const privateIpRange = [
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
              if (privateData[details.tabId][keys[i]].filter(x => x !== 0).every(val => u8a.includes(val))) {
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
            if (privateData[details.tabId][keys[i]].filter(x => x !== 0).every(val => u8a.includes(val))) {
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
          del(details.tabId);

          // Surpress block error page
          return { redirectUrl: 'javascript:' };
        }
        removeBg();

        chrome.tabs.create({ url: 'https://savethelogin.world' });
      }
      del(details.tabId);
    }
    return {};
  },
  { urls: ['http://*/*'] },
  ['blocking', 'requestBody']
);
/* jslint ignore:end */

/*
 * Store HTTP Response headers
 */
chrome.webRequest.onResponseStarted.addListener(
  details => {
    if (!enabled) return;
    if (details.statusCode === 200) {
      // If response type is not subframe
      if (details.type === 'main_frame') {
        let obj = {};
        obj['stl_tab_' + details.tabId] = details;
        // Store http reponse to local storage
        chrome.storage.local.set(obj);
      }
    }
  },
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
