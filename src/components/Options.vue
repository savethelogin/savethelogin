<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <h4 class="mt-3">Basics</h4>
    <hr class="mt-0" />
    <div class="row">
      <div class="col-12" v-for="(val, key) in options">
        <div class="float-left">
          <p>{{ getDescription(key) }}</p>
        </div>
        <div class="float-right">
          <ToggleSwitch v-bind:checked="val" v-on:toggle="updateOption(key, $event)" />
        </div>
        <div class="clearfix"></div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../common/Config';
import { openDefaultPort } from '../common/Utils';
import ToggleSwitch from './ToggleSwitch';

const { PROJECT_PREFIX } = config;

export default {
  name: 'Options',
  components: {
    ToggleSwitch,
  },
  data() {
    return {
      options: [],
    };
  },
  created() {
    let port = openDefaultPort();
    port.onMessage.addListener(message => {
      if (message.type === 'update_context') {
        try {
          let context = JSON.parse(message.data);
          let optionKeys = Object.keys(context).filter(key => key.slice(-8) === '_enabled');
          let obj = {};
          for (let i = 0; i < optionKeys.length; ++i) {
            obj[optionKeys[i]] = context[optionKeys[i]];
          }
          this.options = obj;
        } catch (e) {
          console.log(e);
        }
      }
    });
    port.postMessage({ type: 'retrieve_context' });
  },
  methods: {
    _keyToName: function(key) {
      return key.replace(/_enabled$/, '');
    },
    getDescription: function(key) {
      let name = this._keyToName(key);
      return chrome.i18n.getMessage(`options_${name}_desc`);
    },
    updateOption: function(key, event) {
      let port = openDefaultPort();
      port.postMessage({
        type: 'update_options',
        name: key,
        data: event.target.checked,
      });
    },
  },
};
</script>

<style scoped>
/**/
#image {
  max-width: 100%;
  height: auto;
}
</style>
