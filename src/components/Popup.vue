<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="container w-100">
    <div class="row">
      <a href="#" v-on:click.prevent="openWebsite">
        <img id="logo" src="/icons/logo.png" width="300" />
      </a>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="float-right">
          <ToggleSwitch v-bind:checked="isEnabled" v-bind:callback="setEnabled" />
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
    <div class="row" v-if="isEnabled">
      <div class="col-12">
        <div class="row">
          <div class="btn-group w-100">
            <BaseButton
              v-bind:classes="currentView === 'inspect' ? ['active'] : []"
              v-bind:callback="changeView('inspect')"
            >
              <vue-chrome-i18n>__MSG_inspect__</vue-chrome-i18n>
            </BaseButton>
            <BaseButton
              v-bind:classes="currentView === 'options' ? ['active'] : []"
              v-bind:callback="changeView('options')"
            >
              <vue-chrome-i18n>__MSG_options__</vue-chrome-i18n>
            </BaseButton>
          </div>
        </div>
        <div class="row">
          <transition name="component-fade" mode="out-in">
            <component v-bind:is="currentView" />
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../classes/Config';

import Inspect from './Inspect';
import Options from './Options';
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Popup',
  components: {
    inspect: Inspect,
    options: Options,
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
    setEnabled: function(event) {
      let checked = event.target.checked;
      chrome.storage.sync.set({ [`${config.PROJECT_PREFIX}_disabled`]: !!!checked }, () => {
        let port = chrome.runtime.connect({ name: `${config.PROJECT_PREFIX}` });
        port.postMessage({
          type: 'update_toggle',
          data: checked,
        });
        this.isEnabled = checked;
      });
    },
    openWebsite: function() {
      chrome.tabs.create({ url: `https://${config.PROJECT_DOMAIN}/` });
    },
  },
  data() {
    return {
      isEnabled: false,
      currentView: 'inspect',
    };
  },
  created() {
    chrome.storage.sync.get([`${config.PROJECT_PREFIX}_disabled`], items => {
      const item = items[`${config.PROJECT_PREFIX}_disabled`];
      if (item === undefined) this.isEnabled = true;
      else this.isEnabled = !!!item;
    });
  },
};
</script>

<style>
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
</style>
