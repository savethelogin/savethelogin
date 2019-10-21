import { expect } from 'chai';
import flushPromises from 'flush-promises';

import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import { CookiePlugin, I18nPlugin } from 'sinon-chrome/plugins';
import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

import config from '../src/Config';
import Popup from '../src/components/Popup';
import ToggleSwitch from '../src/components/ToggleSwitch';

chrome.registerPlugin(new CookiePlugin());
chrome.registerPlugin(new I18nPlugin());

global.chrome = chrome;

describe('Popup', () => {
  beforeEach(() => {
    chrome.flush();
    chrome.runtime.connect.withArgs(sinon.match.object).returns({ postMessage: sinon.spy() });
  });

  it('has a created hook', async () => {
    const mockTab = {
      id: 1,
    };

    const mockHttpHeaders = [
      {
        name: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      { name: 'Server', value: 'Apache/2.4.10' },
      { name: 'X-Frame-Options', value: 'deny' },
      { name: 'X-Powered-By', value: 'PHP/7.1.30' },
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

    chrome.cookies.state = [
      {
        domain: `${config.PROJECT_DOMAIN}`,
        hostOnly: true,
        httpOnly: false,
        path: '/',
        secure: false,
        storeId: 0,
        session: true,
        name: 'PHPSESSID',
        value: '0123456789deadbeef',
      },
    ];

    chrome.storage.sync.get.yields({
      [`${config.PROJECT_PREFIX}_disabled`]: false,
    });
    chrome.tabs.query.yields([mockTab]);
    chrome.storage.local.get.yields({
      [`${config.PROJECT_PREFIX}_tab_${mockTab.id}`]: mockDetails,
    });

    expect(Popup.created).to.be.a('function');

    let wrapper = shallowMount(Popup);
    await flushPromises();

    wrapper.destroy();

    chrome.tabs.query.yields([mockTab]);
    chrome.storage.local.get.flush();

    wrapper = shallowMount(Popup);
    await flushPromises();

    wrapper.destroy();
  });

  it('has default data', () => {
    expect(Popup.data).to.be.a('function');
    expect(Popup.data()).to.exist;
  });

  it('shows error checklist not exists', () => {
    const wrapper = mount(Popup, {
      attachToDocument: true,
    });
    expect(wrapper.find('.alert').exists()).to.be.false;

    const checkBoxInput = wrapper.find('input[type="checkbox"]');
    expect(checkBoxInput.exists()).to.be.true;
    checkBoxInput.setChecked();

    chrome.storage.sync.set.yield();

    return Vue.nextTick().then(() => {
      expect(wrapper.find('.alert').exists()).to.be.true;
    });
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

    expect(wrapper.find('button').exists()).to.be.true;

    chrome.tabs.reload.yields([1]);
    wrapper.find('button').trigger('click');

    await flushPromises();
  });

  describe('#gradeColor', () => {
    it('returns css class by grade', () => {
      const methods = Popup.methods;

      expect(methods.gradeColor('SAFE')).to.equals('text-success');
      expect(methods.gradeColor('NORM')).to.equals('text-warning');
      expect(methods.gradeColor('VULN')).to.equals('text-danger');
    });
  });

  describe('#setEnabled', () => {
    it('is a callback of toggle button', () => {
      const wrapper = mount(Popup);

      expect(wrapper.vm.isEnabled).to.be.false;
      wrapper.find('input[type="checkbox"]').setChecked();
      chrome.storage.sync.set.yield();

      return Vue.nextTick().then(() => {
        expect(wrapper.vm.isEnabled).to.be.true;
      });
    });
  });

  describe('#openWebsite', () => {
    it('opens official website on new tab', () => {
      const methods = Popup.methods;
      methods.openWebsite();

      expect(chrome.tabs.create.calledOnce).to.be.true;
    });
  });
});

describe('ToggleSwitch', () => {
  it('calls callback function when state changed', done => {
    const callback = e => {
      done();
    };

    const wrapper = shallowMount(ToggleSwitch, {
      propsData: {
        checked: false,
        type: 'round',
        callback: callback,
      },
    });

    const checkBoxInput = wrapper.find('input[type="checkbox"]');
    checkBoxInput.setChecked();
  });
});
