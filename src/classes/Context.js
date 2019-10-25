/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

import config from './Config';

class Context {
  constructor() {
    // Is extenstion enabled?
    this._enabled = false;

    // Options
    this._opt_plain_text = true;
    this._opt_session_hijack = false;

    // Cookies
    this._cookies = [];
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

  set plainText(newValue) {
    this._opt_plain_text = newValue;
  }

  get sessHijack() {
    return this._opt_session_hijack;
  }

  set sessHijack(newValue) {
    this._opt_session_hijack = newValue;
  }

  get cookies() {
    return this._cookies;
  }

  set cookies(newValue) {
    this._cookies = newValue;
  }
}

// Use as singleton
export default new Context();
