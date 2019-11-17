import Vue from 'vue';
import Whitelist from '@/components/Whitelist';

new Vue({
  el: '#app',
  components: { Whitelist },
  render: h => h(Whitelist),
});
