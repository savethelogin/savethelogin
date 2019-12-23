<template>
  <div>
    <h4 class="mb-2 mt-3">Block</h4>
    <hr class="mt-0" />
    <BaseButton v-bind:callback="openWhitelist" class="btn-sm">Whitelist</BaseButton>
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
