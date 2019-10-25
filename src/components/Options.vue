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
      <small>
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
import Context from '../classes/Context';
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Options',
  components: {
    ToggleSwitch,
  },
  computed: {
    plainText: {
      get: function() {
        return Context.plainText;
      },
      set: function(newValue) {
        Context.plainText = newValue;
      },
    },
    sessHijack: {
      get: function() {
        return Context.sessHijack;
      },
      set: function(newValue) {
        Context.sessHijack = newValue;
      },
    },
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
      return chrome.i18n.getMessage('options_exp_session_hijack');
    },
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

<style>
/**/
</style>
