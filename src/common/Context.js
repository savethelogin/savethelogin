/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

import config from '@/common/Config';

/**
 * Singleton for store states to indicate context
 */
class Context {
  constructor() {
    this.names = [];

    // Is extenstion enabled?
    this.set('enabled', false);
  }

  /**
   * Context setter
   */
  set(name, value) {
    if (this.names.indexOf(name) === -1) {
      this.names.push(name);
    }
    this[name] = value;
  }

  /**
   * Context getter
   */
  get(name) {
    return this[name];
  }

  /**
   * Remove context variable
   */
  del(name) {
    let list = this.list();
    let index = list.indexOf(name);
    this.names.splice(index, 1);
    delete this[name];
  }

  list() {
    return this.names;
  }

  serialize() {
    let retObj = {};
    let list = this.list();
    for (let i = 0; i < list.length; ++i) {
      retObj[list[i]] = this.get(list[i]);
    }
    return JSON.stringify(retObj);
  }
}

// Use as singleton
export default new Context();
