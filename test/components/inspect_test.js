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
import Inspect from '../../src/components/Inspect';

describe('Inspect', function() {
  before(function() {
    chrome.registerPlugin(new CookiePlugin());
    chrome.registerPlugin(new I18nPlugin());

    global.chrome = chrome;
  });

  beforeEach(async function() {
    const tabId = 1;
    const mockTab = {
      id: tabId,
    };
    chrome.tabs.query.withArgs({ active: true, currentWindow: true }).yields([mockTab]);

    const mockResponseHeaders = [
      {
        name: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
      {
        name: 'Server',
        value: 'nginx/1.12.2',
      },
      {
        name: 'X-Powered-By',
        value: 'PHP/7.1.30',
      },
    ];
    const mockDetails = {
      url: `https://${config.PROJECT_DOMAIN}/`,
      responseHeaders: mockResponseHeaders,
    };
    chrome.storage.local.get.yields({
      [`${config.PROJECT_PREFIX}_tab_${tabId}`]: mockDetails,
    });
    global.wrapper = mount(Inspect);
    await flushPromises();
  });

  describe('#data', function() {
    it('has scheme', function() {
      expect(wrapper.vm.scheme).to.be.exist;
    });

    it('has checklist', function() {
      expect(wrapper.vm.checklist).to.be.exist;
    });
  });

  // TODO: Add more test cases

  afterEach(function() {
    delete global.wrapper;
    chrome.flush();
  });

  after(function() {
    delete global.chrome;
  });
});
