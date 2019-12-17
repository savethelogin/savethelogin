/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import axios from 'axios';
import config from '@/common/Config';
import { unique, setStorage, getStorage, createNotification } from '@/common/Utils';

const { PROJECT_PREFIX, API_URL, API_SCHEME } = config;

const moduleName = 'phishing';
/** Well known domains */
const whiteDomains = [/.google.com$/, /.facebook.com$/];
const apiReponsekeys = ['classification', 'probability'];
/**
 * Time units
 */
export const SECOND = 1;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * Default expire value
 */
export const DEFAULT_EXPIRE = 7 * DAY;

const classificationPhishing = 0;
const probabilityThreshold = 0.8;

const phishingHostsKey = `${PROJECT_PREFIX}_${moduleName}_hosts`;
const phishingExpireKey = `${PROJECT_PREFIX}_${moduleName}_expire`;

let hostnames = {};
let expire = DEFAULT_EXPIRE;

function filterHosts() {
  for (var hostname in hostnames) {
    let time;
    let current;
    let classification;
    let probability;
    try {
      time = new Date(hostnames[hostname].time);
      current = new Date().getTime();
    } catch (e) {
      // Remove invalid entries
      delete hostnames[hostname];
      continue;
    }
    if (!apiReponsekeys.every(key => Object.keys(hostnames[hostname]).includes(key))) {
      delete hostnames[hostname];
      continue;
    }
    // On expired
    if (time === NaN || time.getTime() + hostnames[hostname].expire * 1000 <= current) {
      delete hostnames[hostname];
    }
  }
}

getStorage({ keys: [phishingHostsKey, phishingExpireKey] }).then(items => {
  const hosts = items[phishingHostsKey];
  if (hosts) {
    hostnames = hosts;
    filterHosts();
    console.log(hostnames);
  }
  const savedExpire = items[phishingExpireKey];
  if (savedExpire) {
    expire = savedExpire;
  }
  setStorage({
    items: {
      [phishingExpireKey]: expire,
    },
  });
});

export function onConnect(port) {
  console.assert(port.name == `${PROJECT_PREFIX}`);
  port.onMessage.addListener(message => {
    switch (message.type) {
      case 'update_expire': {
        setStorage({
          items: {
            [phishingExpireKey]: message.data,
          },
        });
        break;
      }
      default:
        break;
    }
  });
}

function createPhishingNofity() {
  createNotification({
    title: chrome.i18n.getMessage('phishing_notification_title'),
    message: chrome.i18n.getMessage('phishing_notification_content'),
  });
}

function isPhishing({ classification, probability }) {
  return (
    classification === classificationPhishing.toString() &&
    probabilityThreshold <= parseFloat(probability)
  );
}

export function onUpdated(tabId, changeInfo, tab) {
  const url = new URL(tab.url);
  const hostname = url.hostname;

  if (!['http', 'https'].includes(url.protocol.slice(0, -1))) return;

  switch (tab.status) {
    case 'loading': {
      // Explicitly exclude white domains
      if (whiteDomains.some(domain => hostname.match(domain))) return;

      // Pass if requestes before
      if (Object.keys(hostnames).includes(hostname)) return;

      // Create new entry
      hostnames[hostname] = {};
      hostnames[hostname]['time'] = new Date().toISOString();
      hostnames[hostname]['expire'] = expire; // Seconds

      axios
        .get(`${API_SCHEME}://${API_URL}/phishing?url=${tab.url}`)
        .then(response => {
          console.log(response);

          // TODO: Server API Implementation
          const data = response.data;
          if (data) {
            if (
              isPhishing({
                classification: data.classification,
                probability: data.probability,
              })
            ) {
              createPhishingNofity();
            }
            for (var key in apiReponsekeys) {
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
        });
      break;
    }
    case 'complete':
      filterHosts();
      if (!Object.keys(hostnames).includes(hostname)) return;
      if (
        isPhishing({
          classification: hostnames[hostname].classification,
          probability: hostnames[hostname].probability,
        })
      ) {
        createPhishingNofity();
        return;
      }
      break;
    default:
      break;
  }
}

export default {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  DEFAULT_EXPIRE,
  onConnect,
  onUpdated,
};
