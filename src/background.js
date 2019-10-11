/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

// Store private values
let pv = {};
// Is extenstion enabled?
let enabled = false;

// Check extension disabled
chrome.storage.sync.get(['stl_disabled'], items => {
  const item = items.stl_disabled;
  if (item === undefined) enabled = true;
  else enabled = item;
});

// Bind event handler to webpage
let bind = tabId => {
  if (!enabled) return;
  chrome.tabs.executeScript(
    {
      // Check all frames (e.g. iframe, frame)
      allFrames: true,
      code: `(function() {
      var handler = function(e) {
        var value;
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
        var port = chrome.runtime.connect({name: "stl"});
        port.postMessage({
          type: 'update_data',
          key: ${tabId},
          data: value
        });
      };
      var key = ${tabId};
      var pwFields = document.querySelectorAll("input[type=password]");
      var iterable = Array.from(pwFields);
      var pwForms = [].filter.call(document.querySelectorAll('form'),
        function(el) {
          return el.querySelector('input[type=password]') ? el : null;
        }
      );
      iterable = iterable.concat(pwForms);
      iterable.forEach(function(el) {
        switch (el.tagName.toLowerCase()) {
        case 'input':
          el.addEventListener("keyup", handler);
          break;
        case 'form':
          el.addEventListener("submit", handler);
          break;
        default:
          break;
        }
        console.log(el.tagName);
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

// Delete all datas in pv
let flush = () => {
  pv = {};
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
  port.onMessage.addListener(msg => {
    console.log(msg);
    switch (msg.type) {
      case 'update_data':
        pv[msg.key] = msg.data.toString();
        break;
      case 'update_toggle': {
        enabled = msg.data;
        break;
      }
      default:
        break;
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId, removed) => {
  // Remove pv by tab id when tab closed
  delete pv[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!enabled) return;
  console.log(tabId, changeInfo, tab);
  // Remove pv by tab id when tab updated
  delete pv[tabId];
  // Bind script to webpage
  bind(tabId);
});

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
        const priv_range = [
          // 10.0.0.0 – 10.255.255.255
          /10\.(2[0-5][0-5]|1[0-9][0-9]|[1-9][0-9]|[0-9])/,
          // 172.16.0.0 – 172.31.255.255
          /172\.(1[6-9]|2[0-9]|3[0-1])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])/,
          // 192.168.0.0 – 192.168.255.255
          /192\.168\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])\.(1[0-9][0-9]|2([0-4][0-9]|5[0-5])|[0-9])/,
        ];
        // Create filter by priv_range
        const ruleset = new RegExp('^' + priv_range.map(x => x.source).join('|') + '$');
        if (hostname.match(ruleset)) return;
      }
      // Skip when pv not exists
      if (!pv[details.tabId]) {
        return {};
      }
      let flag = false;
      // Create Uint8Array sequence to check rawData
      let seq = new Uint8Array(pv[details.tabId].split('').map(c => c.charCodeAt(0)));
      const formData = details.requestBody.formData;
      if (formData) {
        first: for (let key in formData) {
          for (let i = 0; i < formData[key].length; ++i) {
            // If formData contains plain pv
            if (formData[key][i].toString().indexOf(pv[details.tabId]) !== -1) {
              flag = true;
              break first;
            }
          }
        }
      }
      const rawData = details.requestBody.raw;
      if (!flag && rawData) {
        for (let i = 0; i < rawData.length; ++i) {
          // Convert rawData to Uint8Array
          const u8a = new Uint8Array(rawData[i].bytes);
          if (seq.every(val => u8a.includes(val))) {
            flag = true;
            break;
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

        chrome.tabs.create({ url: 'https://savethelogin.world' });
      }
      delete pv[details.tabId];
    }

    return {};
  },
  { urls: ['http://*/*'] },
  ['blocking', 'requestBody']
);
/* jslint ignore:end */

chrome.webRequest.onResponseStarted.addListener(
  details => {
    if (!enabled) return;
    if (details.statusCode === 200) {
      const url = new URL(details.url);
      const protocol = url.protocol.slice(0, -1);

      // If response type is not subframe
      if (details.type === 'main_frame') {
        let obj = {};
        obj['stl_tab_' + details.tabId] = details;
        // Store http reponse to local storage
        chrome.storage.local.set(obj);
        console.log(details);
      }
    }
  },
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
