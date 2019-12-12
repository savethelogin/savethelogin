<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <CheckList v-bind:scheme="scheme" v-bind:checklist="checklist" />
</template>

<script>
import config from '../common/Config';
import { queryTab, getStorage } from '../common/Utils';
import CheckList from './CheckList';

export default {
  components: {
    CheckList,
  },
  data() {
    return {
      scheme: 'http',
      checklist: {},
    };
  },
  methods: {
    /**
     * Promises
     **/
    storagePromise: function(currentTab) {
      return new Promise((resolve, reject) => {
        getStorage({ keys: [`${config.PROJECT_PREFIX}_tab_${currentTab.id}`] }).then(items => {
          const item = items[`${config.PROJECT_PREFIX}_tab_${currentTab.id}`];
          if (!item) return reject();
          return resolve(item);
        });
      });
    },
    cookiePromise: function(wrapper, url) {
      return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ url: url }, cookies => {
          let flag = false;
          for (let i = 0; i < cookies.length; ++i) {
            // If cookie type is session and httpOnly flag is disabled
            // Vulnerable to session cookie hijacking
            if (cookies[i].session && !cookies[i].httpOnly) {
              // Test cookie name
              const name = cookies[i].name;
              const tests = [
                /^ID_/i,
                /_ID$/i,
                /SESS(ION)?/gi,
                /LOG(IN|GED)/gi,
                /ACCOUNT/gi,
                /MEMBER/gi,
                /AUTH(ORIZED?|ENTICATED?)?/gi,
                /ADM(IN)?/gi,
                /^TOKEN_/i,
                /_TOKEN$/i,
              ];
              if (tests.some(t => t.exec(name))) {
                flag = true;
                break;
              }
            }
          }
          if (!flag) {
            wrapper.session_cookie_xss.description = chrome.i18n.getMessage('safe');
            wrapper.session_cookie_xss.grade = 'SAFE';
          }
          return resolve();
        });
      });
    },
  },
  async created() {
    let wrapper = {};
    const items = [
      'scheme',
      'hsts_policy',
      'clickjacking_prevention',
      'xss_protection_policy',
      'server_version_disclosure',
      'servlet_spec_disclosure',
      'session_cookie_xss',
    ];
    // Set default values
    items.forEach(el => {
      wrapper[el] = {};
      wrapper[el].name = chrome.i18n.getMessage(el);
      wrapper[el].grade = 'VULN'; // Default grade to 'vulnerable'
    });

    // Start promise chain
    const tabs = await queryTab({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const item = await this.storagePromise(currentTab);

    const url = new URL(item.url);
    const scheme = url.protocol.slice(0, -1);

    if (scheme === 'https') {
      wrapper.scheme.grade = 'SAFE';
    }
    this.scheme = scheme;

    wrapper.scheme.description = scheme;

    const headers = item.responseHeaders;

    for (let i = 0; i < headers.length; ++i) {
      const header = headers[i];
      switch (header.name.toLowerCase()) {
        // Check HSTS header
        case 'strict-transport-security': {
          if (scheme === 'https') {
            // Get max-age value parsed from HSTS header
            let maxAge = parseInt((/max\-age=([0-9]+)/gi.exec(header.value) || [, '0'])[1]);
            wrapper.hsts_policy.description = `${chrome.i18n.getMessage('moderate')}`;
            wrapper.hsts_policy.grade = 'NORM';
            // Check HSTS header setting is safe from SSL Strip attack
            if (header.value.toLowerCase().indexOf('includesubdomains') !== -1) {
              wrapper.hsts_policy.description = `${chrome.i18n.getMessage(
                'safe'
              )} (SSL Strip safe)`;
              wrapper.hsts_policy.grade = 'SAFE';
            }
          }
          break;
        }
        case 'server': {
          // Check server header contains any version value
          if (header.value.match(/[0-9]+(\.([0-9]+))+/g)) {
            wrapper.server_version_disclosure.description = `${chrome.i18n.getMessage(
              'vulnerable'
            )}`;
            wrapper.server_version_disclosure.grade = 'VULN';
          }
          break;
        }
        case 'x-frame-options': {
          wrapper.clickjacking_prevention.description = `${chrome.i18n.getMessage('moderate')}`;
          wrapper.clickjacking_prevention.grade = 'NORM';

          if (
            header.value.toLowerCase() === 'deny' ||
            header.value.toLowerCase() === 'sameorigin'
          ) {
            wrapper.clickjacking_prevention.description = `${chrome.i18n.getMessage('safe')}`;
            wrapper.clickjacking_prevention.grade = 'SAFE';
          }
          break;
        }
        case 'x-xss-protection': {
          if (header.value.toString() !== '0') {
            wrapper.xss_protection_policy.description = `${chrome.i18n.getMessage('moderate')}`;
            wrapper.xss_protection_policy.grade = 'NORM';
            if (header.value.indexOf('mode=block') !== -1) {
              wrapper.xss_protection_policy.description = `${chrome.i18n.getMessage(
                'safe'
              )} (Rendering block)`;
              wrapper.xss_protection_policy.grade = 'SAFE';
            }
          }
          break;
        }
        // Check if servlet value exposed
        case 'x-powered-by': {
          wrapper.servlet_spec_disclosure.description = `${chrome.i18n.getMessage('vulnerable')}`;
          wrapper.xss_protection_policy.grade = 'VULN';
          break;
        }
        default:
          break;
      }
    }

    // Assign description by name with "recommend" suffix
    Object.keys(wrapper).forEach(el => {
      if (!wrapper[el].description)
        wrapper[el].description = `${chrome.i18n.getMessage('vulnerable')}
          ${chrome.i18n.getMessage(el + '_recommend')}`;
    });
    await this.cookiePromise(wrapper, item.url.toString());
    // Assign wrapped object to checklist
    this.checklist = wrapper;
  },
};
</script>

<style></style>
