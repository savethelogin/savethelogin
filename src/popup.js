/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */
import 'bootstrap/dist/css/bootstrap.min.css';

import Vue from 'vue';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

import Popup from './components/Popup';

const requireComponent = require.context('./components', false, /Base[A-Z]\w+\.(vue|js)$/);

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName);
  const componentName = upperFirst(
    camelCase(
      fileName
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
    )
  );
  Vue.component(componentName, componentConfig.default || componentConfig);
});

new Vue({
  el: '#app',
  components: { Popup },
  render: h => h(Popup),
});
