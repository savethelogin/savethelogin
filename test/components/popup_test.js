/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import { expect } from 'chai';
import flushPromises from 'flush-promises';

import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import { CookiePlugin, I18nPlugin } from 'sinon-chrome/plugins';

import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

import '../../src/components/Globals';
import config from '../../src/common/Config';
import Popup from '../../src/components/Popup';

describe('Popup', function() {
  before(function() {
    chrome.registerPlugin(new CookiePlugin());
    chrome.registerPlugin(new I18nPlugin());

    global.chrome = chrome;
  });

  beforeEach(function() {
    chrome.flush();
    chrome.runtime.connect.withArgs(sinon.match.object).returns({ postMessage: sinon.spy() });
  });

  it('has a created hook', async function() {
    const mockTab = {
      id: 1,
    };

    const mockHttpHeaders = [
      { name: 'Content-Encoding', value: 'gzip' },
      {
        name: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      { name: 'Server', value: 'Apache/2.4.10' },
      { name: 'X-Frame-Options', value: 'deny' },
      { name: 'X-Powered-By', value: 'PHP/7.1.30' },
      { name: 'X-XSS-Protection', value: '0; mode=block' },
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

  it('has default data', function() {
    expect(Popup.data).to.be.a('function');
  });

  describe('#data', function() {
    before(function() {
      global.wrapper = shallowMount(Popup);
    });

    it('has isEnabled', function() {
      expect(wrapper.vm.isEnabled).to.be.false;
    });

    it('has currentView', function() {
      expect(wrapper.vm.currentView).to.be.a('string');
    });

    after(function() {
      delete global.wrapper;
    });
  });

  describe('#setEnabled', function() {
    it('is a callback of toggle button', function() {
      const wrapper = mount(Popup);

      wrapper.find('input[type="checkbox"]').setChecked();
      chrome.storage.sync.set.yield();

      return Vue.nextTick().then(function() {
        expect(wrapper.vm.isEnabled).to.be.true;
      });
    });
  });

  describe('#openWebsite', function() {
    it('opens official website on new tab', function() {
      const methods = Popup.methods;
      methods.openWebsite();

      expect(chrome.tabs.create.calledOnce).to.be.true;
    });
  });

  describe('#changeView', function() {
    it('changes component', function() {
      chrome.runtime.connect.withArgs(sinon.match.object).returns({
        onMessage: {
          addListener: function() {},
        },
        postMessage: sinon.spy(),
      });
      const wrapper = mount(Popup);
      const before = wrapper.vm.currentView;
      wrapper.setData({ isEnabled: true });

      wrapper.find('button:not(.active)').trigger('click');
      expect(wrapper.vm.currentView).to.be.not.equal(before);
    });
  });

  after(function() {
    chrome.flush();
    delete global.chrome;
  });
});
