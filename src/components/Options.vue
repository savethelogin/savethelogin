<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <h4 class="mt-3">Basics</h4>
    <hr class="mt-0" />
    <div class="row">
      <div class="col">
        <ToggleSwitch />
      </div>
    </div>
    <h4 class="mt-3">Experimental</h4>
    <hr class="mt-0" />
    <div class="row">
      <div class="col">
        <ToggleSwitch />
      </div>
    </div>
  </div>
</template>

<script>
import ToggleSwitch from './ToggleSwitch';

export default {
  name: 'Options',
  components: {
    ToggleSwitch,
  },
};
</script>

<style>
/**/
</style>
