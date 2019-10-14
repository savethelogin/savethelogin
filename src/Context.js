/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

class Context {
  constructor() {
    // Is extenstion enabled?
    this._enabled = false;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(enabled) {
    this._enabled = enabled;
  }
}

export default new Context();
