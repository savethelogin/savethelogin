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

  function SimpleTemplate(obj) {
    if (!obj || !obj.target) return;

    var i;
    var target = document.querySelector(obj.target);
    var innerHTML = target.innerHTML;
    var templateBraces = innerHTML.match(/\{\{([^\{\}]+?)\}\}/g);
    if (!templateBraces) return;

    var variables = map(templateBraces, function(item) {
      return item.match(/\{\{([^\{\}]+?)\}\}/)[1].trim();
    });

    for (i = 0; i < variables.length; ++i) {
      try {
        var result;
        if (variables[i].match(/^[0-9]+$/)) {
          result = parseInt(variables[i]);
        } else {
          result = chrome.i18n.getMessage(variables[i]);
        }
        innerHTML = innerHTML.replace(/\{\{[^\{\}]+?\}\}/, result);
      } catch (e) {}
    }
    target.innerHTML = innerHTML;
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
