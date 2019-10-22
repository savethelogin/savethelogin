<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="row">
    <div class="col">
      <div class="row">
        <a href="#" v-on:click.prevent="openWebsite">
          <img id="logo" src="/icons/logo.png" width="300" />
        </a>
      </div>
      <div class="row d-flex justify-content-end">
        <div class="mr-2">
          <ToggleSwitch v-bind:checked="isEnabled" v-bind:callback="setEnabled" />
        </div>
      </div>
    </div>
    <div class="col" v-if="isEnabled">
      <div class="row">
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
            <button v-on:click="refreshPage" class="btn btn-link text-danger">
              <i class="material-icons">refresh</i> {{ msgRefresh }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../classes/Config';

import CheckItem from './CheckItem';
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Popup',
  components: {
    CheckItem,
    ToggleSwitch,
  },
  data() {
    return {
      scheme: 'http',
      isEnabled: false,
      checklist: {},
    };
  },
  computed: {
    msgNoInformation: function() {
      return chrome.i18n.getMessage('no_information');
    },
    msgRefresh: function() {
      return chrome.i18n.getMessage('refresh');
    },
  },
  methods: {
    // Return text style class by grade
    gradeColor: function(item) {
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
    },
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
    // If toggle button state changed to enabled
    setEnabled: function(event) {
      let checked = event.target.checked;
      chrome.storage.sync.set({ [`${config.PROJECT_PREFIX}_disabled`]: checked }, () => {
        let port = chrome.runtime.connect({ name: `${config.PROJECT_PREFIX}` });
        port.postMessage({
          type: 'update_toggle',
          data: checked,
        });
        this.isEnabled = checked;
      });
    },
    openWebsite: function() {
      chrome.tabs.create({ url: `https://${config.PROJECT_DOMAIN}/` });
    },
    /**
     * Promises
     **/
    tabPromise: function() {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          return resolve(tabs[0]);
        });
      });
    },
    storagePromise: function(currentTab) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([`${config.PROJECT_PREFIX}_tab_${currentTab.id}`], items => {
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
  created() {
    chrome.storage.sync.get([`${config.PROJECT_PREFIX}_disabled`], items => {
      const item = items[`${config.PROJECT_PREFIX}_disabled`];
      if (item === undefined) this.isEnabled = true;
      else this.isEnabled = item;
    });

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
    this.tabPromise()
      .then(currentTab => {
        return this.storagePromise(currentTab);
      })
      .then(item => {
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
              wrapper.servlet_spec_disclosure.description = `${chrome.i18n.getMessage(
                'vulnerable'
              )}`;
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
        return this.cookiePromise(wrapper, item.url.toString());
      })
      .then(() => {
        // Assign wrapped object to checklist
        this.checklist = wrapper;
      })
      .catch(error => {});
  },
};
</script>

<style scoped>
#logo {
  margin-left: 120px;
}

.btn,
.alert,
.badge {
  border-radius: 0;
}

.table th {
  white-space: nowrap;
}

code {
  display: block;
  white-space: pre-wrap;
}

.material-icons {
  vertical-align: inherit;
}

.material-icons.md-18 {
  font-size: 18px;
}

.material-icons.md-24 {
  font-size: 24px;
}

.material-icons.md-36 {
  font-size: 36px;
}

.material-icons.md-48 {
  font-size: 48px;
}
</style>
