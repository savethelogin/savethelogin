/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import SimpleTemplate from '@/plugins/simple-template/index';

function blocked() {
  let currentUrl = new URL(location.href);
  if (currentUrl.pathname !== '/page-blocked.html') return;

  let params = currentUrl.searchParams;
  let details;
  try {
    details = JSON.parse(atob(params.get('details')));
  } catch (e) {}

  let highlight;
  try {
    let highlightMatch = params.get('highlight');
    if (highlightMatch) {
      highlight = atob(highlightMatch);
    }
  } catch (e) {}

  let highlighter = function(string) {
    return string.replace(
      highlight,
      '<span class="highlight" title="' +
        chrome.i18n.getMessage('malicious') +
        '!">' +
        highlight +
        '</span>'
    );
  };
  let url = details ? details.url : '';

  // Only accept http scheme
  url = url.match(/^https?:\/\//) ? url : 'about:blank';

  let st = new SimpleTemplate({
    target: '#root',
    data: {
      detail: url,
    },
  });

  document.getElementById('back').onclick = function() {
    history.back();
  };

  document.getElementById('disable').onclick = function() {
    let port = chrome.runtime.connect({ name: 'stl' });
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
    let code = document.getElementsByTagName('code')[0];
    let innerHTML = code.innerHTML;
    code.innerHTML = highlighter(innerHTML);
  };
}

blocked();
