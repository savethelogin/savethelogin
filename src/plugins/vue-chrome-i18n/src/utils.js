/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
export const pattern = /__MSG_([A-Za-z0-9_-]+)__/g;

export function replacer(match, p1, offset, string) {
  return chrome.i18n.getMessage(p1);
}

export default {
  replacer: replacer,
  pattern: pattern,
};
