/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

export function onUpdated(tabId, changeInfo, tab) {
  switch (tab.status) {
    case 'loading': {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      break;
    }
    default:
      break;
  }
}

export default {
  onUpdated,
};
