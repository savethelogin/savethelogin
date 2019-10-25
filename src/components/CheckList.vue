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
      <h4 class="alert-heading">{{ msgNoInformation }}</h4>
      <p class="mb-0">
        <BaseButton theme="link" v-bind:callback="refreshPage" v-bind:classes="['text-danger']">
          <i class="material-icons">refresh</i> {{ msgRefresh }}
        </BaseButton>
      </p>
    </div>
  </div>
</template>

<script>
import CheckItem from './CheckItem';

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
    refreshPage: function() {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          resolve(tabs[0]);
        });
      }).then(currentTab => {
        chrome.tabs.reload(currentTab.id, {}, () => {});
        window.close();
      });
    },
  },
};
</script>

<style></style>
