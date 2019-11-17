<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <button v-bind:type="type" v-bind:class="['btn'].concat(bsTheme).join(' ')" v-on:click="clicked">
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
  },
  computed: {
    bsTheme: function() {
      return 'btn-' + this.theme;
    },
  },
  methods: {
    clicked: function() {
      this.$emit('press');
    },
  },
};
</script>

<style></style>
