/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import { expect } from 'chai';
import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import flushPromises from 'flush-promises';

import { executeScript, funcToStr } from '../../src/common/Utils';

describe('Util', function() {
  before(function() {
    global.chrome = chrome;
  });

  beforeEach(function() {
    chrome.flush();
  });

  describe('executeScript', function() {
    it('execute script on tab by using chrome api', async function() {
      executeScript({
        details: {
          code: 'alert(0)',
        },
      });
      chrome.tabs.executeScript.yield();
      await flushPromises();

      expect(chrome.tabs.executeScript.calledOnce).to.be.true;
    });
  });

  describe('funcToStr', function() {
    it('returns code from function', function() {
      function foo() {
        console.log('bar');
      }
      expect(funcToStr(foo)).to.include("console.log('bar')");
    });
  });
});
