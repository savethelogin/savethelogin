<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <tr>
    <th>{{ item.name }}</th>
    <td v-html="item.description" v-bind:class="classify && classify(item)" />
  </tr>
</template>

<script>
export default {
  name: 'CheckItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
    classify: {
      type: Function,
    },
  },
};
</script>

<style></style>
