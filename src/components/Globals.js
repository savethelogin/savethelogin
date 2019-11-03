/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world> */

import Vue from 'vue';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

import VueChromeI18n from '../plugins/vue-chrome-i18n/src/index';

Vue.use(VueChromeI18n);

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
