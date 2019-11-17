/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/components/Globals';

import Vue from 'vue';
import Popup from '@/components/Popup';

new Vue({
  el: '#app',
  components: { Popup },
  render: h => h(Popup),
});
