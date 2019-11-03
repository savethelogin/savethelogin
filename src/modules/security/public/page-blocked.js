/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
(function(window, document) {
  function map(arr, callback) {
    var i;
    var ret = [];
    for (i = 0; i < arr.length; ++i) {
      ret.push(callback(arr[i]));
    }
    return ret;
  }

  function replacer(match, p1, offset, string) {
    return chrome.i18n.getMessage(p1.trim());
  }

  function SimpleTemplate(obj) {
    if (!obj || !obj.target) return;

    var i;
    var pattern = /\{\{([^\{\}]+?)\}\}/g;
    var target = document.querySelector(obj.target);
    var innerHTML = target.innerHTML;
    var templateBraces = innerHTML.match(pattern);
    if (!templateBraces) return;

    target.innerHTML = innerHTML.replace(pattern, replacer);
  }
  window.SimpleTemplate = SimpleTemplate;
})(window, document);

(function(window, document) {
  var st = new SimpleTemplate({
    target: '#root',
    data: {
      details: details,
    },
  });

  var detailsArg = location.href.match(
    /^[a-z-]+:\/\/[a-z]+\/page-blocked.html\?details=([a-z0-9\/\+=]+)/i
  )[1];
  if (!detailsArg) return;

  var details = JSON.parse(atob(detailsArg));

  document.getElementById('back').onclick = function() {
    history.back();
  };

  document.getElementById('disable').onclick = function() {
    window.location.hash = '!redirect';

    var port = chrome.runtime.connect({ name: 'stl' });
    port.postMessage({
      type: 'update_options',
      name: 'security_enabled',
      data: false,
    });
  };

  window.onload = function() {
    var uri = window.location.href;
    if (uri.match(/#\!redirect/)) {
      window.location.href = details.url;
    }
  };
})(window, document);
