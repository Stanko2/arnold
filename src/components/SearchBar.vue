<template>
  <div class="input-group position-sticky">
    <input
      type="text"
      class="form-control"
      placeholder="Search Documents ..."
      v-model="searchStr"
      @input="search"
    />
    <div class="input-group-append">
      <button class="btn btn-success" @click="search">
        <span class="material-icons">search</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  mounted() {},
  data() {
    return {
      searchStr: "",
    };
  },
  methods: {
    search() {
      this.$emit("search", this.searchStr);
    },
  },
});
</script>