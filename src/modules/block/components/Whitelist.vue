<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="container mt-5">
    <h1 v-chrome-i18n>__MSG_whitelist_heading__</h1>
    <textarea class="form-control mb-3" rows="15" cols="120" v-model="whitelist" v-focus></textarea>
    <div class="btn-group float-left">
      <BaseButton theme="secondary" v-bind:callback="closeWhitelist" v-chrome-i18n>
        __MSG_close__
      </BaseButton>
    </div>
    <div class="btn-group float-right">
      <BaseButton theme="light" v-bind:callback="resetWhitelist">
        __MSG_reset__
      </BaseButton>
      <BaseButton theme="primary" v-bind:callback="saveWhitelist">
        __MSG_save__
      </BaseButton>
    </div>
    <div class="clearfix"></div>
  </div>
</template>

<script>
import {
  setStorage,
  getStorage,
  removeTab,
  currentTab,
  openDefaultPort,
  unique,
} from '@/common/Utils';

export default {
  name: 'Whitelist',
  data() {
    return {
      whitelistBackup: [],
      whitelist: '',
    };
  },
  async created() {
    let items = await getStorage({ area: 'local', keys: ['block_whitelist'] });
    this.updateWhitelist(items['block_whitelist']);

    // Backup whitelist
    this.whitelistBackup = this.unserialize(this.whitelist);

    let domain = this.getParam('domain');
    this.appendUrl(domain);
  },
  methods: {
    getParam: function(name) {
      let url = new URL(location.href);
      return url.searchParams.get(name);
    },
    appendUrl: function(url) {
      let whitelist = this.unserialize(this.whitelist);
      if (whitelist && whitelist.includes(url)) return;
      whitelist = (whitelist || []).concat([url]);
      this.whitelist = this.serialize(whitelist);
    },
    updateWhitelist: function(whitelist) {
      if (whitelist) this.whitelist = this.serialize(unique(whitelist));
      let port = openDefaultPort();
      port.postMessage({
        type: 'update_whitelist',
        data: this.unserialize(this.whitelist),
      });
    },
    closeWhitelist: async function() {
      let tab = await currentTab();
      removeTab(tab.id);
    },
    resetWhitelist: function() {
      this.updateWhitelist(this.whitelistBackup);
    },
    saveWhitelist: async function() {
      await setStorage({
        area: 'local',
        items: {
          block_whitelist: this.unserialize(this.whitelist),
        },
      });
      this.updateWhitelist(this.unserialize(this.whitelist));
    },
    serialize: function(list) {
      let string;
      if (list) {
        string = list.join('\n');
      }
      return string || '';
    },
    unserialize: function(string) {
      let list;
      if (string) {
        list = string.split('\n');
      }
      if (list) {
        list = list.filter(x => x);
      }
      return list || [];
    },
  },
};
</script>

<style scoped>
/**/
</style>
