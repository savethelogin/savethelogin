/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import { expect } from 'chai';
import flushPromises from 'flush-promises';

import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import { CookiePlugin, I18nPlugin } from 'sinon-chrome/plugins';

import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

import '../../src/components/Globals';
import Options from '../../src/components/Options';

describe('Options', function() {
  before(function() {
    chrome.registerPlugin(new CookiePlugin());
    chrome.registerPlugin(new I18nPlugin());

    global.chrome = chrome;
  });

  beforeEach(function() {
    chrome.flush();
    chrome.runtime.connect.withArgs(sinon.match.object).returns({ postMessage: sinon.spy() });
  });

  it('has data', function() {
    expect(Options.data).to.be.a('function');
  });

  it('has create hook', function() {
    expect(Options.created).to.be.a('function');
  });

  describe('#data', function() {
    before(function() {
      global.wrapper = shallowMount(Options);
    });

    it('watches plainText', function() {
      wrapper.vm.plainText = !wrapper.vm.plainText;
      chrome.storage.sync.set.yield();
      return Vue.nextTick().then(function() {
        expect(chrome.storage.sync.set.calledOnce).to.be.true;
      });
    });

    it('watches sessHijack', function() {
      wrapper.vm.sessHijack = !wrapper.vm.sessHijack;
      chrome.storage.sync.set.yield();
      return Vue.nextTick().then(function() {
        expect(chrome.storage.sync.set.calledOnce).to.be.true;
      });
    });
  });
});
