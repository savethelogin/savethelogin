/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import axios from 'axios';
import config from '@/common/Config';
import {
  unique,
  increaseBadgeCount,
  setStorage,
  getStorage,
  createNotification,
} from '@/common/Utils';

const { PROJECT_PREFIX, API_URL, API_SCHEME } = config;

const moduleName = 'phishing';
let isEnabled = false;

/** Well known domains */
const whiteDomains = [
  /\.savethelogin\.world$/,
  /\.google\.com$/,
  /\.youtube\.com$/,
  /\.reddit\.com$/,
  /\.netflix\.com$/,
  /\.office\.com$/,
  /\.microsoft\.com$/,
  /\.live\.com$/,
  /\.facebook\.com$/,
  /\.twitter\.com$/,
  /\.instagram\.com$/,
  /\.ebay\.com$/,
  /\.bbc\.com$/,
  /\.pinterest\.com$/,
  /\.fedex\.com$/,
  /\.dhl\.com$/,
  /\.aol\.com$/,
  /\.bankofamerica\.com$/,
  /\.cnet\.com$/,
  /\.stack(overflow|exchange)\.com$/,
  /\.(drop)?box\.com$/,
  /\.imdb\.com$/,
  /\.paypal\.com$/,
  /\.taobao\.com$/,
  /\.imgur\.com$/,
  /\.wordpress\.com$/,
  /\.tumblr\.com$/,
  /\.pastebin\.com$/,
  /\.twitch\.tv$/,
  /\.spotify\.com$/,
  /\.steam(powered)?\.com$/,
  /\.yahoo\.com$/,
  /\.git(lab|hub)\.com$/,
  /\.apple\.com$/,
  /\.baidu\.com$/,
  /\.qq\.com$/,
  /\.cnn\.com$/,
  /\.linkedin\.com$/,
  /\.adobe\.com$/,
  /\.wikipedia\.org$/,
  /\.bing\.com$/,
];
const apiReponsekeys = ['classification', 'probability'];
/**
 * Time units
 */
export const SECOND = 1;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;

/**
 * Default expire value
 */
export const DEFAULT_EXPIRE = MONTH;

const classificationPhishing = 0;
const probabilityThreshold = 0.7;
const probabilityDefiniteThreshold = 0.9;

const SAFE = 0;
const SUSPECT = -1;
const DEFINITE = 1;

export const phishingHostsKey = `${PROJECT_PREFIX}_${moduleName}_hosts`;
export const phishingExpireKey = `${PROJECT_PREFIX}_${moduleName}_expire`;
export const phishingEnabledKey = `${PROJECT_PREFIX}_${moduleName}_enabled`;

let hostnames = {};
let expire = DEFAULT_EXPIRE;

getStorage({ keys: [phishingHostsKey, phishingExpireKey, phishingEnabledKey] }).then(items => {
  const hosts = items[phishingHostsKey];
  if (typeof hosts !== 'undefined') {
    hostnames = hosts;
    filterHosts();
    console.log(hostnames);
  }
  const savedExpire = items[phishingExpireKey];
  if (typeof savedExpire !== 'undefined') {
    expire = savedExpire;
  }
  const savedEnabled = items[phishingEnabledKey];
  if (typeof savedEnabled !== 'undefined') {
    isEnabled = savedEnabled;
  }
  setStorage({
    items: {
      [phishingExpireKey]: expire,
    },
  });
});

function filterHosts() {
  console.log('before filtered: ', hostnames);
  for (let hostname in hostnames) {
    let time = new Date(hostnames[hostname].time);
    let current = new Date().getTime();

    console.log('before filtered: ', Object.keys(hostnames[hostname]));

    // Validate all caches
    if (!apiReponsekeys.every(key => Object.keys(hostnames[hostname]).includes(key))) {
      delete hostnames[hostname];
      continue;
    }
    // On expired
    if (time === NaN || time.getTime() + hostnames[hostname].expire * 1000 <= current) {
      delete hostnames[hostname];
    }
  }
  console.log('after filtered: ', hostnames);
}

export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      case 'update_phishing_expire': {
        setStorage({
          items: {
            [phishingExpireKey]: message.data,
          },
        });
        break;
      }
      case 'update_phishing_enabled': {
        isEnabled = message.data;
        setStorage({
          items: {
            [phishingEnabledKey]: message.data,
          },
        });
        break;
      }
      default:
        break;
    }
  });
}

function createPhishingNotify({ tabId, probability }) {
  if (!isEnabled) return;
  switch (probability) {
    case DEFINITE:
      createNotification({
        title: chrome.i18n.getMessage('phishing_notification_title'),
        message: chrome.i18n.getMessage('phishing_notification_content'),
      });
      break;
    case SUSPECT:
      createNotification({
        title: chrome.i18n.getMessage('phishing_notification_suspect_title'),
        message: chrome.i18n.getMessage('phishing_notification_suspect_content'),
      });
      break;
    case SAFE:
    default:
      break;
  }
}

function isPhishing({ classification, probability }) {
  if (classification !== classificationPhishing.toString()) return SAFE;
  if (probabilityThreshold <= parseFloat(probability)) {
    if (probabilityDefiniteThreshold <= parseFloat(probability)) {
      return DEFINITE;
    }
    return SUSPECT;
  }
  return SAFE;
}

export function onUpdated(tabId, changeInfo, tab) {
  if (!isEnabled) return;

  const url = new URL(tab.url);
  const hostname = url.hostname;

  if (!['http', 'https'].includes(url.protocol.slice(0, -1))) return;

  switch (tab.status) {
    case 'loading': {
      // Explicitly exclude white domains
      if (whiteDomains.some(domain => hostname.match(domain))) return;

      // Pass if requested before
      if (Object.keys(hostnames).includes(hostname)) return;

      // Create new entry
      hostnames[hostname] = {};
      hostnames[hostname]['time'] = new Date().toISOString();
      hostnames[hostname]['expire'] = expire; // Seconds

      axios
        .get(`${API_SCHEME}://${API_URL}/phishing?url=${tab.url}`)
        .then(response => {
          console.log(response);

          const data = response.data;
          if (data) {
            let phishingFlag = isPhishing({
              classification: data.classification,
              probability: data.probability,
            });
            if (phishingFlag !== SAFE) {
              createPhishingNotify({ tabId: tabId, probability: phishingFlag });
            }
            // Cache api result
            for (let key of apiReponsekeys) {
              hostnames[hostname][key] = data[key];
            }
          }
          setStorage({
            items: {
              [phishingHostsKey]: hostnames,
            },
          });
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          console.log('done');
          filterHosts();
        });
      break;
    }
    case 'complete':
      let phishingFlag = isPhishing({
        classification: hostnames[hostname].classification,
        probability: hostnames[hostname].probability,
      });
      if (phishingFlag !== SAFE) {
        increaseBadgeCount(tabId);
        return;
      }
      break;
    default:
      break;
  }
}

export function onBeforeSendHeaders(details) {
  if (!isEnabled) return;

  if (details.type !== 'main_frame') return;
  console.log('phishing:', details);

  let url = new URL(details.url);
  let hostname = url.hostname;

  if (!Object.keys(hostnames).includes(hostname)) return;
  let phishingFlag = isPhishing({
    classification: hostnames[hostname].classification,
    probability: hostnames[hostname].probability,
  });
  if (phishingFlag !== SAFE) {
    createPhishingNotify({ tabId: details.tabId, probability: phishingFlag });
    return;
  }
}

export default {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  DEFAULT_EXPIRE,
  phishingHostsKey,
  phishingEnabledKey,
  phishingExpireKey,
  onConnect,
  onUpdated,
  onBeforeSendHeaders,
};
