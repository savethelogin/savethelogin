/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import axios from 'axios';
import config from '@/common/Config';
import { unique, setStorage, getStorage, createNotification } from '@/common/Utils';

const { PROJECT_PREFIX, API_URL, API_SCHEME } = config;

const moduleName = 'phishing';
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

getStorage({ keys: [phishingHostsKey, phishingExpireKey] }).then(items => {
  const hosts = items[phishingHostsKey];
  if (hosts) {
    hostnames = hosts;
    for (var hostname in hostnames) {
      const time = new Date(hostnames[hostname].time);
      const current = new Date().getTime();
      if (time === NaN || time.getTime() + hostnames[hostname].expire * 1000 <= current) {
        delete hostnames[hostname];
      }
    }
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

export function onUpdated(tabId, changeInfo, tab) {
  switch (tab.status) {
    case 'loading': {
      const url = new URL(tab.url);
      const hostname = url.hostname;

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
          if (
            data &&
            data.classification === classificationPhishing.toString() &&
            probabilityThreshold <= parseFloat(data.probability)
          ) {
            createNotification({
              title: chrome.i18n.getMessage('phishing_notification_title'),
              message: chrome.i18n.getMessage('phishing_notification_content'),
            });
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
