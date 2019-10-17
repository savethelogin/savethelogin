import assert from 'assert';

import chrome from 'sinon-chrome/extensions';
import { shallowMount } from '@vue/test-utils';

import Popup from '../src/components/Popup';

global.chrome = chrome;

describe('Popup', () => {
  const wrapper = shallowMount(Popup);

  it('has a created hook', () => {
    assert(typeof Popup.created === 'function');
  });

  it('has default data', () => {
    assert(typeof Popup.data === 'function' && Popup.data());
  });

  it('shows error checklist not exists', () => {
    wrapper.setData({ isEnabled: true });
    assert(wrapper.find('.alert').exists() === true);
  });
});
