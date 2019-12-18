/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

class Config {
  // Configurations
  constructor() {
    this.PROJECT_PREFIX = 'stl';
    this.ID_PREFIX = `__${this.PROJECT_PREFIX}__`;
    this.PROJECT_DOMAIN = 'savethelogin.world';
    this.API_URL = `api.${this.PROJECT_DOMAIN}`;
    this.API_SCHEME = 'https';
  }
}

export default new Config();
