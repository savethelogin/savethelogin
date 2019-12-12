/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import axios from 'axios';
import config from '@/common/Config';
import { unique } from '@/common/Utils';

const { API_URL, API_SCHEME } = config;

let hostnames = [];

export function onUpdated(tabId, changeInfo, tab) {
  switch (tab.status) {
    case 'loading': {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      if (hostnames.includes(hostname)) return;
      hostnames.push(hostname);

      axios
        .get(`${API_SCHEME}://${API_URL}/phishing?url=${tab.url}`)
        .then(response => {
          console.log(response);
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
  onUpdated,
};
