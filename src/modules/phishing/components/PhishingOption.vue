<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div>
    <h4 class="mb-2 mt-3" v-chrome-i18n>__MSG_phishing__</h4>
    <hr class="mt-0" />
    <ToggleSwitch class="float-right" v-bind:checked="isEnabled" v-on:toggle="changeEnabled" />
    <div class="input-group input-group-sm" v-if="isEnabled">
      <div class="input-group-prepend">
        <span class="input-group-text">Expire</span>
      </div>
      <select name="expire" class="form-control" v-bind:value="expire" v-on:change="expireChanged">
        <option value="1" v-bind:selected="expire == 1">1 day</option>
        <option value="3" v-bind:selected="expire == 3">3 day</option>
        <option value="7" v-bind:selected="expire == 7">1 week</option>
        <option value="14" v-bind:selected="expire == 14">2 week</option>
        <option value="30" v-bind:selected="expire == 30">1 month</option>
        <option value="60" v-bind:selected="expire == 60">2 month</option>
        <option value="180" v-bind:selected="expire == 180">6 month</option>
        <option value="365" v-bind:selected="expire == 365">1 year</option>
      </select>
    </div>
  </div>
</template>

<script>
import config from '@/common/Config';
import { getStorage, setStorage, openDefaultPort } from '@/common/Utils';
import {
  DAY,
  DEFAULT_EXPIRE,
  phishingExpireKey,
  phishingEnabledKey,
} from '@/modules/phishing/Phishing';

import ToggleSwitch from '@/components/ToggleSwitch';

const { PROJECT_PREFIX } = config;
const moduleName = `phishing`;

export const mobileCompatible = true;
export default {
  components: {
    ToggleSwitch,
  },
  data() {
    return {
      expire: 30,
      isEnabled: false,
    };
  },
  async created() {
    const items = await getStorage({
      keys: [phishingExpireKey, phishingEnabledKey],
    });
    if (items[phishingExpireKey]) {
      this.expire = Math.floor(items[phishingExpireKey] / DAY);
    }
    if (typeof items[phishingEnabledKey] === 'undefined') {
      this.isEnabled = false;
    } else {
      this.isEnabled = items[phishingEnabledKey];
    }
  },
  methods: {
    expireChanged: function(event) {
      if (!event.target.value || !event.target.value.match(/^[0-9]+$/)) return;

      this.expire = parseInt(event.target.value);

      let newExpire = this.expire * DAY;
      const port = openDefaultPort();
      port.postMessage({
        type: 'update_phishing_expire',
        data: newExpire,
      });
      setStorage({
        items: {
          [phishingExpireKey]: newExpire,
        },
      });
    },
    changeEnabled: function(event) {
      const checked = event.target.checked;
      setStorage({
        items: {
          [phishingEnabledKey]: checked,
        },
      });
      const port = openDefaultPort();
      port.postMessage({
        type: 'update_phishing_enabled',
        data: checked,
      });
      this.isEnabled = event.target.checked;
    },
  },
};
</script>

<style>
/**/
</style>
