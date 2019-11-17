<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="w-100">
    <table class="table mb-0" v-if="Object.keys(checklist).length">
      <CheckItem v-bind:item="checklist.scheme" v-bind:classify="gradeColor" />
      <CheckItem
        v-if="scheme === 'https'"
        v-bind:item="checklist.hsts_policy"
        v-bind:classify="gradeColor"
      />
      <CheckItem v-bind:item="checklist.clickjacking_prevention" v-bind:classify="gradeColor" />
      <CheckItem v-bind:item="checklist.xss_protection_policy" v-bind:classify="gradeColor" />
      <CheckItem v-bind:item="checklist.session_cookie_xss" v-bind:classify="gradeColor" />
    </table>
    <div class="alert alert-danger w-100 mb-0 text-center" v-else>
      <h4 class="alert-heading">
        <vue-chrome-i18n>__MSG_no_information__</vue-chrome-i18n>
      </h4>
      <p class="mb-0">
        <BaseButton theme="link" v-bind:callback="refreshPage" class="text-danger" v-chrome-i18n>
          <i class="material-icons">refresh</i> __MSG_refresh__
        </BaseButton>
      </p>
    </div>
  </div>
</template>

<script>
import CheckItem from './CheckItem';
import { queryTab } from '@/common/Utils';

function gradeColor(item) {
  switch (item.grade) {
    case 'SAFE':
      return 'text-success';
    case 'NORM':
      return 'text-warning';
    case 'VULN':
      return 'text-danger';
    default:
      break;
  }
}

export default {
  name: 'CheckList',
  components: {
    CheckItem,
  },
  computed: {
    msgNoInformation: function() {
      return chrome.i18n.getMessage('no_information');
    },
    msgRefresh: function() {
      return chrome.i18n.getMessage('refresh');
    },
  },
  props: {
    scheme: {
      type: String,
      default: 'http',
    },
    checklist: {
      type: Object,
    },
  },
  methods: {
    // Return text style class by grade
    gradeColor: gradeColor,
    // Refresh tab and close popup
    refreshPage: async function() {
      const tabs = await queryTab({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      chrome.tabs.reload(currentTab.id, {}, () => {});
      window.close();
    },
  },
};
</script>

<style></style>
