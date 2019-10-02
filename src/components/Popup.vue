<template>
  <div class="row">
    <div class="col">
      <div class="row">
        <img id="logo" src="/icons/logo.png" width="300" />
      </div>
      <div class="row d-flex justify-content-end">
        <div class="mr-2">
          <ToggleSwitch />
        </div>
      </div>
    </div>
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
      <span>{{ noInformationMessage }}</span>
    </div>
  </div>
</template>

<script>
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Popup',
  components: {
    ToggleSwitch,
  },
  computed: {
    noInformationMessage: function() {
      return chrome.i18n.getMessage('no_information');
    },
  },
  methods: {
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
  },
  data() {
    return {
      scheme: 'http',
      checklist: {},
    };
  },
  created() {
    let map = {};
    let keys = ['scheme', 'hsts_policy', 'clickjacking_prevention', 'xss_protection_policy', 'server_version_disclosure', 'servlet_spec_disclosure', 'session_cookie_xss'];
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
        chrome.storage.local.get(['stl_tab_' + currentTab.id], items => {
          const item = items['stl_tab_' + currentTab.id];
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
            if (cookies[i].session && !cookies[i].httpOnly) {
              flag = true;
              break;
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
                let maxAge = parseInt((/max\-age=([0-9]+)/gi.exec(header.value) || [, '0'])[1]);
                map.hsts_policy.description = `${chrome.i18n.getMessage('moderate')}`;
                map.hsts_policy.grade = 'NORM';
                if (header.value.toLowerCase().indexOf('includesubdomains') !== -1) {
                  map.hsts_policy.description = `${chrome.i18n.getMessage('safe')} (SSL Strip safe)`;
                  map.hsts_policy.grade = 'SAFE';
                }
              }
              break;
            }
            case 'server': {
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
            case 'x-powered-by': {
              map.servlet_spec_disclosure.description = `${chrome.i18n.getMessage('vulnerable')}`;
              map.xss_protection_policy.grade = 'VULN';
              break;
            }
            default:
              break;
          }
        }

        Object.keys(map).forEach(el => {
          if (!map[el].description)
            map[el].description = `${chrome.i18n.getMessage('vulnerable')}
              ${chrome.i18n.getMessage(el + '_recommend')}`;
        });
        return cookiePromise(item.url.toString());
      })
      .then(() => {
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
</style>
