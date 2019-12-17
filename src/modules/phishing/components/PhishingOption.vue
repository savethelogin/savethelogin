<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div>
    <h4 class="mb-2 mt-3">Phishing</h4>
    <hr class="mt-0" />
    <div class="input-group input-group-sm">
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
import { DAY, DEFAULT_EXPIRE } from '@/modules/phishing/Phishing';

const { PROJECT_PREFIX } = config;
const expireKey = `${PROJECT_PREFIX}_phishing_expire`;

export const mobileCompatible = true;
export default {
  data() {
    return {
      expire: 0,
    };
  },
  async created() {
    const items = await getStorage({ keys: [expireKey] });
    if (!items[expireKey]) return;
    this.expire = Math.floor(items[expireKey] / DAY);
  },
  methods: {
    expireChanged: function(evt) {
      if (!evt.target.value || !evt.target.value.match(/^[0-9]+$/)) return;

      this.expire = parseInt(evt.target.value);

      let newExpire = this.expire * DAY;
      const port = openDefaultPort();
      port.postMessage({
        type: 'update_expire',
        data: newExpire,
      });
      setStorage({
        items: {
          [expireKey]: newExpire,
        },
      });
    },
  },
};
</script>

<style>
/**/
</style>
