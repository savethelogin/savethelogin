/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

/** Configurations */
class Config {
  constructor() {
    this.PROJECT_PREFIX = 'stl';
    this.ID_PREFIX = `__${this.PROJECT_PREFIX}__`;
    this.PROJECT_DOMAIN = 'savethelogin.world';
  }
}

export default new Config();
