<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <button
    v-on:click.prevent="callback"
    v-bind:type="type"
    v-bind:class="['btn'].concat(bsTheme).join(' ')"
  >
    <slot></slot>
  </button>
</template>

<script>
/**
 * @vue-prop     {String}   [type=button] - Set type of button.
 * @vue-prop     {String}   [theme=light] - Set bootstrap theme.
 * @vue-prop     {Function} [callback=() => {}] - Set callback when
 *                                                click event triggered.
 * @vue-computed {String}   bsTheme - Return bootstrap button class by theme.
 */
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
    callback: {
      type: Function,
      default: () => {},
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
