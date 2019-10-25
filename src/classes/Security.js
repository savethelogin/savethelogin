/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

import config from './Config';
import Context from './Context';

let uniqueDomains = [];

function extractRootDomain(hostname) {
  // Extract original(top) domain of url
  return (hostname.match(/([a-z0-9_-]{3,}((\.[a-z]{2}){1,2}|\.[a-z]{3,}))$/i) || [])[0].replace(
    /^www[0-9]*\./i,
    ''
  );
}

function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
}

export function onUpdated(tabId, changeInfo, tab) {
  if (!Context.enabled || !Context.sessHijack) return {};

  chrome.cookies.getAll({ session: true }, cookies => {
    Context.cookies = cookies;
    uniqueDomains = unique(cookies.map(cookie => extractRootDomain(cookie.domain)));
  });
}
// Initialize cookies when module loaded
onUpdated();

export function onBeforeSendHeaders(details) {
  if (!Context.enabled || !Context.sessHijack) return {};

  if (details.requestHeaders) {
    // Get referer header
    const refererHeader = (details.requestHeaders.filter(header =>
      header.name.match(/^Referer$/i)
    ) || [])[0];

    if (!refererHeader) return {};

    const referer = refererHeader.value;

    const currentUrl = new URL(details.url);
    const refererUrl = new URL(referer);

    // Skip when same domain
    if (currentUrl.hostname === refererUrl.hostname) return {};

    const refererRoot = extractRootDomain(refererUrl.hostname);
    // If referer session cookie exists
    if (uniqueDomains.includes(refererRoot)) {
      let cookies = Context.cookies;
      let refererCookies = cookies.filter(cookie => cookie.domain.includes(refererRoot));
      for (let i = 0; i < refererCookies.length; ++i) {
        const cookie = refererCookies[i];
        if (!cookie || !cookie.value || cookie.value.length < config.HASH_THRESHOLD) continue;
        // Block when url contains session cookie
        if (currentUrl.toString().match(new RegExp(cookie.value, 'gi'))) {
          return { cancel: true };
        }
      }
    }
  }
}

export default {
  onUpdated: onUpdated,
  onBeforeSendHeaders: onBeforeSendHeaders,
};
