/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import Context from '@/common/Context';
import { updateTab, extractRootDomain, unique } from '@/common/Utils';

// https://www.php.net/manual/en/session.configuration.php#ini.session.sid-length
const SESS_THRESHOLD = 22;

let previousUrl = {};
let uniqueDomains = [];
let allCookies = [];

let cancelled = [];
let detailsStore = {};

function addCancelledRequest(details) {
  cancelled.push(details.requestId);
  detailsStore[details.requestId] = details;
}

function removeCancelledRequest(details) {
  let index = cancelled.indexOf(details.requestId);
  cancelled.splice(index, 1);
  delete detailsStore[details.requestId];
}

function encode(string) {
  return encodeURI(string);
}

function doubleEncode(string) {
  return encode(encode(string));
}

function checkPayload({ string, retBool = undefined }) {
  /**
   * Patterns of malicious codes
   */
  const payloadFilter = [
    new RegExp(encode('\0'), 'g'), // Null byte
    new RegExp(doubleEncode('\0'), 'g'),
    /**
     * CSS Injection
     */
    new RegExp('<style.*?>', 'gi'),
    new RegExp(encode('<') + 'style.*?' + encode('>'), 'gi'),
    new RegExp(doubleEncode('<') + 'style.*?' + doubleEncode('>'), 'gi'),
    new RegExp('\\[value.*?\\]', 'gi'),
    new RegExp(encode('[') + 'value.*?' + encode(']'), 'gi'),
    new RegExp(doubleEncode('[') + 'value.*?' + doubleEncode(']'), 'gi'),
    new RegExp('\\{.*([a-z_-]+\\:\\s*url\\s*\\(.*?\\)).*\\}', 'gi'),
    /**
     * Open redirect attack
     */
    new RegExp('javascript:', 'g'),
    new RegExp('javascript' + encode(':'), 'g'),
    new RegExp('javascript' + doubleEncode(':'), 'g'),
  ];
  if (payloadFilter.some(pattern => string.match(pattern))) {
    if (retBool === undefined) return true;
    const payload = payloadFilter
      .map(pattern => string.match(pattern))
      .filter(x => x)
      .pop()
      .pop();
    return payload;
  }
  return retBool === undefined ? false : undefined;
}

function checkCookie(details) {
  if (details.requestHeaders) {
    const referer = previousUrl[details.tabId];
    if (!referer) return false;

    const currentUrl = new URL(details.url);
    const refererUrl = new URL(referer);

    // Skip when same domain
    if (currentUrl.hostname === refererUrl.hostname) return false;

    const refererRoot = extractRootDomain(refererUrl.hostname);
    // If referer session cookie exists
    if (uniqueDomains.includes(refererRoot)) {
      const cookies = allCookies;
      const refererCookies = cookies.filter(cookie => cookie.domain.includes(refererRoot));
      for (let i = 0; i < refererCookies.length; ++i) {
        const cookie = refererCookies[i];
        if (!cookie || !cookie.value || cookie.value.length < SESS_THRESHOLD) continue;
        // Block when url contains session cookie
        console.log(currentUrl.toString(), cookie.value);
        if (currentUrl.toString().includes(cookie.value)) {
          return true;
        }
      }
    }
  }
}

export function onUpdated(tabId, changeInfo, tab) {
  if (!Context.get('enabled') || !Context.get('security_enabled')) return {};

  chrome.cookies.getAll({ session: true }, cookies => {
    allCookies = cookies;
    uniqueDomains = unique(cookies.map(cookie => extractRootDomain(cookie.domain)));
  });
}
// Initialize cookies when module loaded
onUpdated();

export function onRemoved(tabId, removeInfo) {
  delete previousUrl[tabId];
}

/**
 * Block request when url includes payload
 */
export function onBeforeRequest(details) {
  if (!Context.get('enabled') || !Context.get('security_enabled')) return {};
  const payload = checkPayload({
    string: details.url,
    retBool: false,
  });
  if (payload) {
    switch (details.type) {
      case 'main_frame':
        delete details.requestBody;
        addCancelledRequest(details);
        return { cancel: true };
      default:
        return { cancel: true };
    }
  }
}

export function onBeforeSendHeaders(details) {
  if (!Context.get('enabled') || !Context.get('security_enabled')) return {};

  console.log(details);
  if (checkCookie(details)) {
    switch (details.type) {
      default:
        addCancelledRequest(details);
        return { cancel: true };
    }
  }
  switch (details.type) {
    case 'main_frame':
      previousUrl[details.tabId] = details.url;
      break;
    default:
      break;
  }
}

export function onErrorOccurred(details) {
  if (!Context.get('enabled') || !Context.get('security_enabled')) return;

  console.log(details);
  if (cancelled.includes(details.requestId) && details.type === 'main_frame') {
    let storedDetails = detailsStore[details.requestId];
    removeCancelledRequest(details);

    switch (details.error) {
      case 'NS_ERROR_ABORT':
      case 'net::ERR_BLOCKED_BY_CLIENT':
        updateTab({
          updateProperties: {
            url: `/page-blocked.html?details=${btoa(JSON.stringify(storedDetails))}`,
          },
        });
        break;
      default:
        break;
    }
  }
}

export default {
  onUpdated,
  onRemoved,
  onBeforeRequest,
  onBeforeSendHeaders,
  onErrorOccurred,
};
