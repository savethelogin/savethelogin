<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <h4 class="mb-2 mt-3">Phishing</h4>
    <div class="input-group input-group-sm">
      <div class="input-group-prepend">
        <span class="input-group-text">Expire</span>
      </div>
      <input
        type="text"
        class="form-control"
        placeholder="(N) Days"
        v-bind:value="expire"
        v-on:change="expireChanged"
      />
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
