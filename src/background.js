/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

let pv = {};
let bind = tabId => {
  chrome.tabs.executeScript(
    {
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

chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name == 'stl');
  port.onMessage.addListener(msg => {
    console.log(msg);
    switch (msg.type) {
      case 'update_data':
        pv[msg.key] = msg.data.toString();
        break;
      case 'enabled': {
        chrome.browserAction.setPopup({ popup: 'popup.html' });
        break;
      }
      default:
        break;
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId, removed) => {
  delete pv[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(tabId, changeInfo, tab);
  bind(tabId);
});

/* jslint ignore:start */
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    if (details.method === 'POST' && details.requestBody) {
      if (!pv[details.tabId]) {
        return {};
      }
      let flag = false;
      let seq = new Uint8Array(pv[details.tabId].split('').map(c => c.charCodeAt(0)));
      const formData = details.requestBody.formData;
      if (formData) {
        first: for (let key in formData) {
          for (let i = 0; i < formData[key].length; ++i) {
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
          const u8a = new Uint8Array(rawData[i].bytes);
          if (seq.every(val => u8a.includes(val))) {
            flag = true;
            break;
          }
        }
      }
      if (flag) {
        createBg();
        if (!confirm(chrome.i18n.getMessage('confirm_request_block'))) {
          alert(chrome.i18n.getMessage('request_blocked'));
          removeBg();
          return { redirectUrl: 'javascript:' };
          //return { cancel: true };
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
    if (details.statusCode === 200) {
      const url = new URL(details.url);
      const protocol = url.protocol.slice(0, -1);
      /*
      if (details.type.substr(-5) === 'frame' && protocol === 'http') {
        bind(details.tabId);
      }
      */
      if (details.type === 'main_frame') {
        let obj = {};
        obj['stl_tab_' + details.tabId] = details;
        chrome.storage.local.set(obj);
        console.log(details);
      }
    }
  },
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
