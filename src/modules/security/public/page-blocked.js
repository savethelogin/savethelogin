/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
(function(window, document) {
  function stripTags(string) {
    return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function nl2br(string) {
    return string.replace(/\r?\n/g, '<br>');
  }

  function map(arr, callback) {
    var i;
    var ret = [];
    for (i = 0; i < arr.length; ++i) {
      ret.push(callback(arr[i]));
    }
    return ret;
  }

  function r1(match, p1, offset, string) {
    return nl2br(chrome.i18n.getMessage(p1.trim()));
  }

  function r2(match, p1, offset, string) {
    return stripTags(this.data[p1.trim()]);
  }

  // Constructor
  function SimpleTemplate(obj) {
    if (!obj || !obj.target) return;

    this.data = obj.data;

    var i;
    var p1 = /\{\{\s([^\{\}]+?)\s\}\}/g;
    var p2 = /\$\{\s([^\}]+?)\s\}/g;
    var target = document.querySelector(obj.target);
    var innerHTML = target.innerHTML;
    if (!innerHTML.match(p1) && !innerHTML.match(p2)) return;

    innerHTML = innerHTML.replace(p1, r1);
    target.innerHTML = innerHTML.replace(p2, r2.bind(this));
  }

  window.SimpleTemplate = SimpleTemplate;
})(window, document);

(function(window, document) {
  var details;
  var detailsArg;
  try {
    detailsArg = location.href.match(
      /^[a-z-]+:\/\/[a-z]+\/page\-blocked\.html\?.*&?details=([a-z0-9\/\+=]+)/i
    )[1];
    details = JSON.parse(atob(detailsArg));
  } catch (e) {}

  var highlight;
  try {
    var highlightMatch = location.href.match(
      /^[a-z-]+:\/\/[a-z]+\/page\-blocked\.html\?.*&?highlight=([a-z0-9\/\+=]+)/i
    );
    if (highlightMatch) {
      highlight = atob(highlightMatch[1]);
    }
  } catch (e) {}

  var highlighter = function(string) {
    return string.replace(
      highlight,
      '<span class="highlight" title="' +
        chrome.i18n.getMessage('malicious') +
        '!">' +
        highlight +
        '</span>'
    );
  };
  var url = details ? details.url : '';

  // Only accept http scheme
  url = url.match(/^https?:\/\//) ? url : 'about:blank';

  var st = new SimpleTemplate({
    target: '#root',
    data: {
      detail: url,
    },
  });

  document.getElementById('back').onclick = function() {
    history.back();
  };

  document.getElementById('disable').onclick = function() {
    var port = chrome.runtime.connect({ name: 'stl' });
    port.postMessage({
      type: 'update_options',
      name: 'security_enabled',
      data: false,
    });
    setTimeout(function() {
      window.location.href = url;
    }, 500);
  };

  window.onload = function() {
    // Highlight payload
    var code = document.getElementsByTagName('code')[0];
    var innerHTML = code.innerHTML;
    code.innerHTML = highlighter(innerHTML);
  };
})(window, document);
