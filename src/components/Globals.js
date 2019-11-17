/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

import Vue from 'vue';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

import VueCropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';

import VueChromeI18n from '@/plugins/vue-chrome-i18n/src/index';

Vue.use(VueChromeI18n);
Vue.component('vue-cropper', VueCropper);

const requireComponent = require.context('.', false, /Base[A-Z]\w+\.(vue|js)$/);

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
