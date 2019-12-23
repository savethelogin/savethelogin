<template>
  <div>
    <h4 class="mb-2 mt-3" v-chrome-i18n>__MSG_block__</h4>
    <hr class="mt-0" />
    <BaseButton v-bind:callback="openWhitelist" class="btn-sm" v-chrome-i18n
      >__MSG_whitelist__</BaseButton
    >
  </div>
</template>

<script>
import { createTab } from '@/common/Utils';

export default {
  methods: {
    openWhitelist: function() {
      createTab({ url: `/block-whitelist.html` });
    },
  },
};
</script>

<style scoped>
/**/
</style>
