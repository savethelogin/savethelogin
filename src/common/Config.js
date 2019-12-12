/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
/**
 * @file Project configurations
 */

/** Configurations class */
class Config {
  constructor() {
    this.PROJECT_PREFIX = 'stl';
    this.ID_PREFIX = `__${this.PROJECT_PREFIX}__`;
    this.PROJECT_DOMAIN = 'savethelogin.world';
    this.API_URL =
      process.env.NODE_ENV === 'develop'
        ? 'http://127.0.0.1/'
        : `https://api.${this.PROJECT_DOMAIN}/`;
  }
}

export default new Config();
