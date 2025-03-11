<template>
  <Orders :context="context" v-if="context" />
</template>

<script>
import Orders from "@controleonline/ui-orders/src/vue/components/Details.vue";

export default {
  components: {
    Orders,
  },

  data() {
    return {
      context: "sales",
    };
  },
  created() {},
};
</script>
