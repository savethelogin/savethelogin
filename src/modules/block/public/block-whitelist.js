/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import Vue from 'vue';
import Whitelist from '../components/Whitelist';

new Vue({
  el: '#app',
  components: { Whitelist },
  render: h => h(Whitelist),
});
