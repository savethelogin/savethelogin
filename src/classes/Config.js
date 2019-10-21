/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

class Config {
  // Configurations
  constructor() {
    this.PROJECT_PREFIX = 'stl';
    this.ID_PREFIX = `__${this.PROJECT_PREFIX}__`;
    this.PROJECT_DOMAIN = 'savethelogin.world';
    // Shorten value to improve performance
    this.SHORTEN_LENGTH = 0x10;
  }
}

export default new Config();
