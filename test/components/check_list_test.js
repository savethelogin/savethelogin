/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import { expect } from 'chai';
import flushPromises from 'flush-promises';

import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import { CookiePlugin, I18nPlugin } from 'sinon-chrome/plugins';

import Vue from 'vue';
import { mount, shallowMount } from '@vue/test-utils';

import '../../src/components/Globals';
import config from '../../src/classes/Config';
import CheckList from '../../src/components/CheckList';

describe('CheckList', function() {
  const placeHolder = 'foobar';

  before(function() {
    const messages = require('../../src/_locales/en/messages.json');

    chrome.registerPlugin(new CookiePlugin());
    chrome.registerPlugin(new I18nPlugin(messages));

    global.chrome = chrome;
  });

  beforeEach(async function() {
    let checklist = {};
    const items = [
      'scheme',
      'hsts_policy',
      'clickjacking_prevention',
      'xss_protection_policy',
      'server_version_disclosure',
      'servlet_spec_disclosure',
      'session_cookie_xss',
    ];

    items.forEach(el => {
      checklist[el] = {};
      checklist[el].name = chrome.i18n.getMessage(el);
      checklist[el].grade = 'VULN'; // Default grade to 'vulnerable'
      checklist[el].description = placeHolder;
    });

    const wrapper = mount(CheckList, {
      propsData: {
        checklist: checklist,
      },
    });
    global.wrapper = wrapper;
    await flushPromises();
  });

  it('has alert', function() {
    wrapper.setProps({ checklist: {} });
    expect(wrapper.find('.alert').exists()).to.be.true;
  });

  describe('#methods', function() {
    it('has gradeColor', function() {
      expect(wrapper.text()).to.include(placeHolder);
    });

    context('refresh', function() {
      beforeEach(function() {
        wrapper.setProps({ checklist: {} });
      });

      it('has refreshPage', function() {
        const tabId = 1;
        const mockTab = {
          id: tabId,
        };
        chrome.tabs.query.yields([mockTab]);

        wrapper.find('button').trigger('click');
        return Vue.nextTick().then(function() {
          expect(chrome.tabs.reload.calledOnce).to.be.true;
        });
      });

      it('has referesh button', function() {
        const refreshPageStub = sinon.stub();
        wrapper.setMethods({ refreshPage: refreshPageStub });

        return Vue.nextTick()
          .then(function() {
            wrapper.find('button').trigger('click');
          })
          .then(function() {
            expect(refreshPageStub.calledOnce).to.be.true;
          });
      });
    });
  });

  afterEach(function() {
    delete global.wrapper;
    chrome.flush();
  });

  after(function() {
    delete global.chrome;
  });
});
