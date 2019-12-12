<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <button
    v-on:click.prevent="callback"
    v-bind:type="type"
    v-bind:class="
      ['btn']
        .concat(classes)
        .concat(bsTheme)
        .join(' ')
    "
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    type: {
      type: String,
      default: 'button',
    },
    theme: {
      type: String,
      default: 'light',
    },
    classes: {
      type: Array,
      default: [],
    },
    callback: {
      type: Function,
    },
  },
  computed: {
    bsTheme: function() {
      return 'btn-' + this.theme;
    },
  },
};
</script>

<style></style>
