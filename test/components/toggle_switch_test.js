/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */

import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';

import ToggleSwitch from '../../src/components/ToggleSwitch';

describe('ToggleSwitch', function() {
  it('calls callback function when state changed', function(done) {
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
