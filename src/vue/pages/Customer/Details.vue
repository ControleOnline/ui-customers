<template>
  <People :context="context" :peopleId="peopleId" v-if="context" />
</template>

<script>
import People from "@controleonline/ui-people/src/vue/components/People/Details.vue";

export default {
  components: {
    People,
  },

  data() {
    return {
      context: "customers",
      peopleId: null,
    };
  },
  created() {
    this.peopleId = decodeURIComponent(this.$route.params.id);
  },
};
</script>
