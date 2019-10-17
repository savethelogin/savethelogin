import assert from 'assert';
import flushPromises from 'flush-promises';

import chrome from 'sinon-chrome/extensions';
import { CookiePlugin, I18nPlugin } from 'sinon-chrome/plugins';
import { shallowMount } from '@vue/test-utils';

import config from '../src/Config';
import Popup from '../src/components/Popup';
import ToggleSwitch from '../src/components/ToggleSwitch';

chrome.registerPlugin(new CookiePlugin());
chrome.registerPlugin(new I18nPlugin());

global.chrome = chrome;

const mockTab = {
  id: 1,
};

const mockHttpHeaders = [
  { name: 'Strict-Trasnport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { name: 'Server', value: 'Apache/2.4.10' },
];

const mockDetails = {
  requestId: 31337,
  method: 'POST',
  frameId: 123,
  parentFrameId: 123,
  tabId: mockTab.id,
  url: `https://${config.PROJECT_DOMAIN}/`,
  timeStamp: new Date(),
  responseHeaders: mockHttpHeaders,
};

describe('Popup', () => {
  beforeEach(() => {
    chrome.flush();
  });

  it('has a created hook', async () => {
    assert.strictEqual(typeof Popup.created, 'function');

    chrome.storage.sync.get.yields({ [`${config.PROJECT_PREFIX}_disabled`]: false });
    chrome.tabs.query.yields([mockTab]);
    chrome.storage.local.get.yields({
      [`${config.PROJECT_PREFIX}_tab_${mockTab.id}`]: mockDetails,
    });

    const wrapper = shallowMount(Popup);

    await flushPromises();
  });

  it('has default data', () => {
    assert.strictEqual(typeof Popup.data, 'function');
    assert.ok(Popup.data());
  });

  it('shows error checklist not exists', () => {
    const wrapper = shallowMount(Popup);
    assert.ok(!wrapper.find('.alert').exists());
    wrapper.setData({ isEnabled: true });
    assert.ok(wrapper.find('.alert').exists());
  });

  it('refresh tab and close popup when refresh', async () => {
    const wrapper = shallowMount(Popup, {
      data() {
        return {
          isEnabled: true,
        };
      },
    });
    chrome.tabs.query.yields([1]);

    assert.ok(wrapper.find('button').exists());

    chrome.tabs.reload.yields([1]);
    wrapper.find('button').trigger('click');

    await flushPromises();
  });

  const methods = Popup.methods;
  describe('#gradeColor', () => {
    it('returns css class by grade', () => {
      assert.strictEqual(methods.gradeColor('SAFE'), 'text-success');
      assert.strictEqual(methods.gradeColor('NORM'), 'text-warning');
      assert.strictEqual(methods.gradeColor('VULN'), 'text-danger');
    });
  });

  describe('#setEnabled', () => {
    it('is a callback of toggle button', async () => {
      const mockEvent = {
        target: {
          checked: false,
        },
      };
      methods.setEnabled(mockEvent);
    });
  });
});
