/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
/**
 * @file Entry of extension scheme pages
 */
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/components/Globals';

// Import modules
const cache = {};
const requireModules = require.context('./modules/', true, /\/public\/[^_][a-z0-9_-]+.js$/);

/* https://webpack.js.org/guides/dependency-management/#require-context */
function importAll(r) {
  r.keys().forEach(key => (cache[key] = r(key)));
}

// Import every module not start with underscore
importAll(requireModules);
