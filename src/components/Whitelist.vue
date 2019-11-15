<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="container mt-5">
    <h1>Plaintext login whitelist</h1>
    <textarea
      class="form-control mb-3"
      rows="25"
      cols="120"
      v-model="_whitelist"
      v-focus
    ></textarea>
    <div class="btn-group float-left">
      <button type="button" class="btn btn-secondary" v-on:click="closeWhitelist">Close</button>
    </div>
    <div class="btn-group float-right">
      <button type="button" class="btn btn-light" v-on:click="resetWhitelist">Reset</button>
      <button type="button" class="btn btn-primary" v-on:click="saveWhitelist">Save</button>
    </div>
    <div class="clearfix"></div>
  </div>
</template>

<script>
import { setStorage, getStorage, removeTab, currentTab, openDefaultPort } from '../common/Utils';

export default {
  name: 'Whitelist',
  data() {
    return {
      whitelistBackup: [],
      whitelist: [],
      _whitelist: '',
    };
  },
  computed: {
    whitelist: {
      set: function(newValue) {
        this._whitelist = this.serliaze(newValue);
      },
      get: function() {
        return this.unserialize(this._whitelist);
      },
    },
  },
  async created() {
    let items = await getStorage({ area: 'local', keys: ['block_whitelist'] });
    this.updateWhitelist(items['block_whitelist']);

    let domain = this.getParam('domain');
    this.appendUrl(domain);

    // Backup whitelist
    this.whitelistBackup = this.whitelist;
    console.log(this.whitelist, this._whitelist);
  },
  methods: {
    getParam: function(name) {
      let url = new URL(location.href);
      return url.searchParams.get(name);
    },
    appendUrl: function(url) {
      let whitelist = this.whitelist;
      whitelist = (whitelist || []).concat([url]);
      this.updateWhitelist(whitelist);
    },
    updateWhitelist: function(whitelist) {
      if (!whitelist) return;
      this.whitelist = whitelist;
      let port = openDefaultPort();
      port.postMessage({
        type: 'update_whitelist',
        data: this.whitelist,
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
          block_whitelist: this.whitelist,
        },
      });
      this.updateWhitelist(this.whitelist);
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
