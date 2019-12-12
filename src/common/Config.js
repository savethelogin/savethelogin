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
  }
}

export default new Config();
