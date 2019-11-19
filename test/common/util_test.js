/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import { expect } from 'chai';
import sinon from 'sinon';
import chrome from 'sinon-chrome/extensions';
import flushPromises from 'flush-promises';

import {
  executeScript,
  funcToStr,
  extractRootDomain,
  unique,
  fromSnakeToPascalCase,
  fromKebabToPascalCase,
  fromPascalToSnakeCase,
  fromPascalToKebabCase,
} from '../../src/common/Utils';

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

      let baz = {};
      expect(function() {
        funcToStr(baz);
      }).to.throw();
    });
  });

  describe('extractRootDomain', function() {
    it('extract root domain from hostname', function() {
      expect(extractRootDomain('www.google.com')).to.equal('google.com');
      expect(extractRootDomain('www.amazon.co.jp')).to.equal('amazon.co.jp');
      expect(extractRootDomain('foo.bar.baz.com')).to.equal('baz.com');
    });
  });

  describe('unique', function() {
    it('drops duplicate items in array', function() {
      var arr = [1, 2, 2, 3, 2, 1];
      expect(unique(arr)).to.deep.equal([1, 2, 3]);
    });
  });

  describe('fromSnakeToPascalCase', function() {
    it('translate snake case naming to pascal case', function() {
      let result = fromSnakeToPascalCase('func');
      expect(result).to.equal('Func');
      console.log(`result: ${result}`);

      result = fromSnakeToPascalCase('foo_bar_baz');
      expect(result).to.equal('FooBarBaz');
      console.log(`result: ${result}`);

      result = fromSnakeToPascalCase('_test');
      expect(result).to.equal('_Test');
      console.log(`result: ${result}`);

      result = fromSnakeToPascalCase('__hi__');
      expect(result).to.equal('__Hi__');
      console.log(`result: ${result}`);

      result = fromSnakeToPascalCase('hello_world');
      expect(result).to.equal('HelloWorld');
      console.log(`result: ${result}`);

      result = fromSnakeToPascalCase('asdf_');
      expect(result).to.equal('Asdf_');
      console.log(`result: ${result}`);
    });
  });

  describe('fromKebabToPascalCase', function() {
    it('translate kebab case naming to pascal case', function() {
      let result = fromKebabToPascalCase('func');
      expect(result).to.equal('Func');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('foo-bar-baz');
      expect(result).to.equal('FooBarBaz');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('_test');
      expect(result).to.equal('_Test');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('__hi__');
      expect(result).to.equal('__Hi__');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('hello-world');
      expect(result).to.equal('HelloWorld');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('asdf_');
      expect(result).to.equal('Asdf_');
      console.log(`result: ${result}`);

      result = fromKebabToPascalCase('qwerty_uiop');
      expect(result).to.equal('Qwerty_uiop');
      console.log(`result: ${result}`);
    });
  });

  describe('fromPascalToSnakeCase', function() {
    it('translate pascal case naming to pascal case', function() {
      let result = fromPascalToSnakeCase('Func');
      expect(result).to.equal('func');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('FooBarBaz');
      expect(result).to.equal('foo_bar_baz');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('_Test');
      expect(result).to.equal('_test');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('__Hi__');
      expect(result).to.equal('__hi__');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('HelloWorld');
      expect(result).to.equal('hello_world');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('Asdf_');
      expect(result).to.equal('asdf_');
      console.log(`result: ${result}`);

      result = fromPascalToSnakeCase('QwertyUiop');
      expect(result).to.equal('qwerty_uiop');
      console.log(`result: ${result}`);
    });
  });
});
