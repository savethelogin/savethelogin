<template>
  <div class="row">
    <div class="col">
      <div class="row">
        <img id="logo" src="/icons/logo.png" width="300" />
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
          <tr>
            <th>{{ checklist.scheme.name }}</th>
            <td v-html="checklist.scheme.description" v-bind:class="gradeColor(checklist.scheme.grade)"></td>
          </tr>
          <tr v-if="scheme === 'https'">
            <th>{{ checklist.hsts_policy.name }}</th>
            <td v-html="checklist.hsts_policy.description" v-bind:class="gradeColor(checklist.hsts_policy.grade)"></td>
          </tr>
          <tr>
            <th>{{ checklist.clickjacking_prevention.name }}</th>
            <td v-html="checklist.clickjacking_prevention.description" v-bind:class="gradeColor(checklist.clickjacking_prevention.grade)"></td>
          </tr>
          <tr>
            <th>{{ checklist.xss_protection_policy.name }}</th>
            <td v-html="checklist.xss_protection_policy.description" v-bind:class="gradeColor(checklist.xss_protection_policy.grade)"></td>
          </tr>
          <tr>
            <th>{{ checklist.session_cookie_xss.name }}</th>
            <td v-html="checklist.session_cookie_xss.description" v-bind:class="gradeColor(checklist.session_cookie_xss.grade)"></td>
          </tr>
        </table>

        <div class="alert alert-danger w-100 mb-0 text-center" v-else>
          <h4 class="alert-heading">{{ msgNoInformation }}</h4>
          <p class="mb-0">
            <button v-on:click="refreshPage" class="btn btn-link text-danger"><i class="material-icons">refresh</i> {{ msgRefresh }}</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../Config';
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Popup',
  components: {
    ToggleSwitch,
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
    gradeColor: function(grade) {
      switch (grade) {
        case 'SAFE':
          return 'text-success';
        case 'NORM':
          return 'text-warning';
        case 'VULN':
          return 'text-danger';
      }
    },
    // Refresh tab and close popup
    refreshPage: function() {
      new Promise((resolve, reject) => {
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
  },
  data() {
    return {
      scheme: 'http',
      isEnabled: false,
      checklist: {},
    };
  },
  created() {
    chrome.storage.sync.get([`${config.PROJECT_PREFIX}_disabled`], items => {
      const item = items[`${config.PROJECT_PREFIX}_disabled`];
      if (item === undefined) this.isEnabled = true;
      else this.isEnabled = item;
    });

    let map = {};
    let keys = ['scheme', 'hsts_policy', 'clickjacking_prevention', 'xss_protection_policy', 'server_version_disclosure', 'servlet_spec_disclosure', 'session_cookie_xss'];
    // Set default values
    keys.forEach(el => {
      map[el] = {};
      map[el].name = chrome.i18n.getMessage(el);
      map[el].grade = 'VULN'; // Default grade to 'vulnerable'
    });

    const tabPromise = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          return resolve(tabs[0]);
        });
      });
    };

    const storagePromise = currentTab => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([`${config.PROJECT_PREFIX}_tab_${currentTab.id}`], items => {
          const item = items[`${config.PROJECT_PREFIX}_tab_${currentTab.id}`];
          if (!item) return reject();
          return resolve(item);
        });
      });
    };

    const cookiePromise = url => {
      return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ url: url }, cookies => {
          let flag = false;
          for (let i = 0; i < cookies.length; ++i) {
            // If cookie type is session and httpOnly flag is disabled
            // Vulnerable to session cookie hijacking
            if (cookies[i].session && !cookies[i].httpOnly) {
              // Test cookie name
              const name = cookies[i].name;
              const tests = [/^ID_/i, /_ID$/i, /SESS(ION)?/gi, /LOG(IN|GED)/gi, /ACCOUNT/gi, /MEMBER/gi, /AUTH(ORIZED?|ENTICATED?)?/gi, /ADM(IN)?/gi];
              if (tests.some(t => t.exec(name))) {
                flag = true;
                break;
              }
            }
          }
          if (!flag) {
            map.session_cookie_xss.description = chrome.i18n.getMessage('safe');
            map.session_cookie_xss.grade = 'SAFE';
          }
          return resolve();
        });
      });
    };

    tabPromise()
      .then(currentTab => {
        return storagePromise(currentTab);
      })
      .then(item => {
        const url = new URL(item.url);
        const scheme = url.protocol.slice(0, -1);

        if (scheme === 'https') {
          map.scheme.grade = 'SAFE';
        }
        this.scheme = scheme;

        map.scheme.description = scheme;

        const headers = item.responseHeaders;

        for (let i = 0; i < headers.length; ++i) {
          const header = headers[i];
          switch (header.name.toLowerCase()) {
            // Check HSTS header
            case 'strict-transport-security': {
              if (scheme === 'https') {
                // Get max-age value parsed from HSTS header
                let maxAge = parseInt((/max\-age=([0-9]+)/gi.exec(header.value) || [, '0'])[1]);
                map.hsts_policy.description = `${chrome.i18n.getMessage('moderate')}`;
                map.hsts_policy.grade = 'NORM';
                // Check HSTS header setting is safe from SSL Strip attack
                if (header.value.toLowerCase().indexOf('includesubdomains') !== -1) {
                  map.hsts_policy.description = `${chrome.i18n.getMessage('safe')} (SSL Strip safe)`;
                  map.hsts_policy.grade = 'SAFE';
                }
              }
              break;
            }
            case 'server': {
              // Check server header contains any version value
              if (header.value.match(/[0-9]+(\.([0-9]+))+/g)) {
                map.server_version_disclosure.description = `${chrome.i18n.getMessage('vulnerable')}`;
                map.server_version_disclosure.grade = 'VULN';
              }
              break;
            }
            case 'x-frame-options': {
              map.clickjacking_prevention.description = `${chrome.i18n.getMessage('moderate')}`;
              map.clickjacking_prevention.grade = 'NORM';

              if (header.value.toLowerCase() === 'deny' || header.value.toLowerCase() === 'sameorigin') {
                map.clickjacking_prevention.description = `${chrome.i18n.getMessage('safe')}`;
                map.clickjacking_prevention.grade = 'SAFE';
              }
              break;
            }
            case 'x-xss-protection': {
              if (header.value.toString() !== '0') {
                map.xss_protection_policy.description = `${chrome.i18n.getMessage('moderate')}`;
                map.xss_protection_policy.grade = 'NORM';
                if (header.value.indexOf('mode=block') !== -1) {
                  map.xss_protection_policy.description = `${chrome.i18n.getMessage('safe')} (Rendering block)`;
                  map.xss_protection_policy.grade = 'SAFE';
                }
              }
              break;
            }
            // Check if servlet value exposed
            case 'x-powered-by': {
              map.servlet_spec_disclosure.description = `${chrome.i18n.getMessage('vulnerable')}`;
              map.xss_protection_policy.grade = 'VULN';
              break;
            }
            default:
              break;
          }
        }

        // Map description by name with "recommend" suffix
        Object.keys(map).forEach(el => {
          if (!map[el].description)
            map[el].description = `${chrome.i18n.getMessage('vulnerable')}
              ${chrome.i18n.getMessage(el + '_recommend')}`;
        });
        return cookiePromise(item.url.toString());
      })
      .then(() => {
        // Assign mapped object to checklist
        this.checklist = map;
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
