/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import { replacer, pattern } from './utils';

export function bind(el, binding, vnode) {
  let innerHTML = el.innerHTML;
  innerHTML = innerHTML.replace(pattern, replacer);
  el.innerHTML = innerHTML;
  vnode.context.$emit('replaced', vnode);
}

export default {
  bind: bind,
};
