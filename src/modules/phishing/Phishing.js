/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import axios from 'axios';
import config from '@/common/Config';
import { unique, setStorage } from '@/common/Utils';

const { PROJECT_PREFIX, API_URL, API_SCHEME } = config;

let hostnames = {};

export function onUpdated(tabId, changeInfo, tab) {
  switch (tab.status) {
    case 'loading': {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      if (Object.keys(hostnames).includes(hostname)) return;
      // Create new entry
      hostnames[hostname] = {};
      hostnames[hostname]['time'] = new Date();
      hostnames[hostname]['expire'] = 60 * 60 * 24 * 7;

      axios
        .get(`${API_SCHEME}://${API_URL}/phishing?url=${tab.url}`)
        .then(response => {
          console.log(response);

          setStorage({
            items: {
              [`${PROJECT_PREFIX}_phishing_hosts`]: hostnames,
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
  onUpdated,
};
