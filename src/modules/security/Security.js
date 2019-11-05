/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import config from '../../classes/Config';
import Context from '../../classes/Context';

let uniqueDomains = [];
let allCookies = [];

function extractRootDomain(hostname) {
  // Extract original(top) domain of url
  return (hostname.match(/([a-z0-9_-]{3,}((\.[a-z]{2}){1,2}|\.[a-z]{3,}))$/i) || [''])[0].replace(
    /^www[0-9]*\./i,
    ''
  );
}

function unique(array) {
  return array.filter((value, index) => array.indexOf(value) === index);
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
    // Get referer header
    const refererHeader = (details.requestHeaders.filter(header =>
      header.name.match(/^Referer$/i)
    ) || [])[0];

    if (!refererHeader) return false;

    const referer = refererHeader.value;

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
        if (!cookie || !cookie.value || cookie.value.length < config.HASH_THRESHOLD) continue;
        // Block when url contains session cookie
        if (currentUrl.toString().match(cookie.value, 'gi')) {
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
        return {
          redirectUrl: `chrome-extension://${chrome.i18n.getMessage(
            '@@extension_id'
          )}/page-blocked.html?details=${btoa(JSON.stringify(details))}&highlight=${btoa(payload)}`,
        };
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
      case 'main_frame':
        return {
          redirectUrl: `chrome-extension://${chrome.i18n.getMessage(
            '@@extension_id'
          )}/page-blocked.html?details=${btoa(JSON.stringify(details))}`,
        };
      default:
        return { cancel: true };
    }
  }
}

export default {
  onUpdated: onUpdated,
  onBeforeRequest: onBeforeRequest,
  onBeforeSendHeaders: onBeforeSendHeaders,
};
