<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div id="popup" class="container w-100">
    <div class="row">
      <a href="#" v-on:click.prevent="openWebsite">
        <img id="logo" src="/icons/logo.png" width="300" />
      </a>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="float-right">
          <ToggleSwitch v-bind:checked="isEnabled" v-on:toggle="setEnabled($event)" />
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
    <div class="row" v-if="isEnabled">
      <div class="col-12">
        <div class="row">
          <div class="btn-group w-100">
            <BaseButton
              v-for="view in views"
              v-bind:key="view"
              v-bind:class="currentView === view ? 'active' : ''"
              v-bind:callback="changeView(view)"
              v-chrome-i18n
            >
              __MSG_{{ view.slice(0, '-pane'.length * -1) }}__
            </BaseButton>
          </div>
        </div>
        <div class="row">
          <transition name="component-fade" mode="out-in">
            <keep-alive>
              <component v-bind:is="currentView" />
            </keep-alive>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import config from '@/common/Config';
import {
  createTab,
  openDefaultPort,
  getStorage,
  setStorage,
  fromPascalToKebabCase,
} from '@/common/Utils';

// Load popup panes
const requirePanes = require.context(
  '../modules/',
  true,
  /\/components\/[A-Z][A-Za-z0-9._-]*Pane\.(js|vue)$/
);
const loadedPanes = requirePanes.keys().map(key => {
  const componentConfig = requirePanes(key);
  const componentName = fromPascalToKebabCase(
    key
      .split('/')
      .pop()
      .replace(/\.\w+$/, '')
  );
  Vue.component(componentName, componentConfig.default || componentConfig);
  return componentName;
});

import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Popup',
  components: {
    ToggleSwitch,
  },
  methods: {
    changeView: function(newView) {
      let view = newView;
      return () => {
        this.currentView = view;
      };
    },
    // If toggle button state changed to enabled
    setEnabled: async function(event) {
      const checked = event.target.checked;
      await setStorage({
        area: 'sync',
        items: {
          [`${config.PROJECT_PREFIX}_disabled`]: !!!checked,
        },
      });
      const port = openDefaultPort();
      port.postMessage({
        type: 'update_toggle',
        data: checked,
      });
      this.isEnabled = checked;
    },
    openWebsite: function() {
      createTab({ url: `https://${config.PROJECT_DOMAIN}/` });
    },
  },
  data() {
    return {
      isEnabled: false,
      currentView: loadedPanes[0],
      views: loadedPanes,
    };
  },
  async created() {
    const items = await getStorage({ area: 'sync', keys: [`${config.PROJECT_PREFIX}_disabled`] });
    const item = items[`${config.PROJECT_PREFIX}_disabled`];
    if (item === undefined) this.isEnabled = true;
    else this.isEnabled = !!!item;
  },
};
</script>

<style>
/**
 * Global
 */
body {
  width: 550px;
  min-height: 100px;
  max-height: 700px;
  position: relative;
  vertical-align: middle;
  overflow-x: hidden;
  overflow-y: auto;
}

body::-webkit-scrollbar {
  background-color: #fff;
  width: 16px;
}

body::-webkit-scrollbar-track {
  background-color: #fff;
}

body::-webkit-scrollbar-thumb {
  background-color: #babac0;
  border-radius: 16px;
  border: 4px solid #fff;
}

body::-webkit-scrollbar-button {
  display: none;
}

/**
 * Layout
 **/
#logo {
  margin-left: 120px;
}

.btn,
.alert,
.badge {
  border-radius: 0;
}

.table th {
  white-space: nowrap;
}

code {
  display: block;
  white-space: pre-wrap;
}

/**
 * Material icons
 **/
.material-icons {
  vertical-align: inherit;
}

.material-icons.md-18 {
  font-size: 18px;
}

.material-icons.md-24 {
  font-size: 24px;
}

.material-icons.md-36 {
  font-size: 36px;
}

.material-icons.md-48 {
  font-size: 48px;
}

/**
 * Transition
 **/
.component-fade-enter-active,
.component-fade-leave-active {
  transition: opacity 0.25s ease;
}

.component-fade-enter, .component-fade-leave-to
/* .component-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

/**
 * If mobile device
 */
@media (max-width: 550px) {
  #logo {
    margin-left: calc(50vw - (300px / 2));
  }
}
</style>
