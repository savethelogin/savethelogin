/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/components/Globals';

import Vue from 'vue';
import Popup from '@/components/Popup';
import { isMobile } from '@/common/Utils';

new Vue({
  el: '#app',
  components: { Popup },
  render: h => h(Popup),
});

// Set body width 100% when mobile
if (isMobile()) {
  document.body.style.width = '100%';
}
