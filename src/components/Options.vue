<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <h4 class="mt-3">{{ msgBasics }}</h4>
    <hr class="mt-0" />
    <div class="row">
      <div class="col-12">
        <div class="float-left">
          <p>{{ msgPlainText }}</p>
        </div>
        <div class="float-right">
          <ToggleSwitch v-bind:checked="plainText" v-bind:callback="changeOption('plain_text')" />
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
    <h4 class="mt-3">
      {{ msgExperimental }}
      <small class="text-danger">
        <i class="material-icons">warning</i>
      </small>
    </h4>
    <hr class="mt-0" />
    <div class="row">
      <div class="col-12">
        <div class="float-left">
          <p>{{ msgSessionHijack }}</p>
        </div>
        <div class="float-right">
          <ToggleSwitch
            v-bind:checked="sessHijack"
            v-bind:callback="changeOption('session_hijack')"
          />
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../classes/Config';
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Options',
  components: {
    ToggleSwitch,
  },
  data() {
    return {
      plainText: true,
      sessHijack: false,
    };
  },
  watch: {
    plainText: function(newValue) {
      chrome.storage.sync.set(
        {
          [`${config.PROJECT_PREFIX}_opt_plain_text`]: newValue,
        },
        () => {
          let port = chrome.runtime.connect({ name: `${config.PROJECT_PREFIX}` });
          port.postMessage({
            type: 'update_options',
            name: 'plain_text',
            data: newValue,
          });
        }
      );
    },
    sessHijack: function(newValue) {
      chrome.storage.sync.set(
        {
          [`${config.PROJECT_PREFIX}_opt_session_hijack`]: newValue,
        },
        () => {
          let port = chrome.runtime.connect({ name: `${config.PROJECT_PREFIX}` });
          port.postMessage({
            type: 'update_options',
            name: 'session_hijack',
            data: newValue,
          });
        }
      );
    },
  },
  computed: {
    msgBasics: function() {
      return chrome.i18n.getMessage('basics');
    },
    msgExperimental: function() {
      return chrome.i18n.getMessage('experimental');
    },
    msgPlainText: function() {
      return chrome.i18n.getMessage('options_plain_text');
    },
    msgSessionHijack: function() {
      return chrome.i18n.getMessage('options_session_hijack');
    },
  },
  created() {
    chrome.storage.sync.get(
      [`${config.PROJECT_PREFIX}_opt_plain_text`, `${config.PROJECT_PREFIX}_opt_session_hijack`],
      items => {
        this.plainText = items[`${config.PROJECT_PREFIX}_opt_plain_text`] ? true : false;
        this.sessHijack = items[`${config.PROJECT_PREFIX}_opt_session_hijack`] ? true : false;
      }
    );
  },
  methods: {
    changeOption: function(option) {
      switch (option) {
        case 'plain_text':
          return event => {
            this.plainText = event.target.checked;
          };
        case 'session_hijack':
          return event => {
            this.sessHijack = event.target.checked;
          };
        default:
          break;
      }
    },
  },
};
</script>

<style scoped>
/**/
</style>
