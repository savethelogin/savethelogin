/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

class Context {
  constructor() {
    // Is extenstion enabled?
    this._enabled = false;

    // Options
    this._opt_plain_text = true;
    this._opt_exp_session_hijack = false;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(enabled) {
    this._enabled = enabled;
  }

  get plainText() {
    return this._opt_plain_text;
  }

  set plainText(value) {
    this._opt_plain_text = value;
  }

  get sessHijack() {
    return this._opt_exp_session_hijack;
  }

  set sessHijack(value) {
    this._opt_exp_session_hijack = value;
  }
}

// Use as singleton
export default new Context();
