/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import 'bootstrap/dist/css/bootstrap.min.css';

import Vue from 'vue';
import App from './classes/App';

new Vue({
  el: '#app',
  components: { App },
  render: h => h(App),
});
