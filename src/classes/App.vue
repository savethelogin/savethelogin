<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="container">
    <component v-bind:is="currentView" />
  </div>
</template>

<script>
import Popup from '../components/Popup';

export default {
  name: 'App',
  data: {
    popup: Popup,
  },
};
</script>

<style scoped>
/**/
</style>
