<template>
  <div>
    <b-input-group style="z-index: 3">
      <b-form-input
        type="text"
        placeholder="Hladat v rieseniach"
        v-model="searchStr"
        @input="search"
        size="lg"
      />
      <b-input-group-append>
        <b-button variant="success" @click="search" size="md">
          <span class="material-icons">search</span>
        </b-button>
        <b-button
          variant="primary"
          id="expand"
          @click="expanded = !expanded"
          size="md"
        >
          <span class="material-icons">{{
            expanded ? "expand_less" : "expand_more"
          }}</span>
        </b-button>
        <b-tooltip target="expand" triggers="hover"
          >Dalsie moznosti hladania</b-tooltip
        >
      </b-input-group-append>
    </b-input-group>
    <transition name="slide">
      <div v-if="expanded" style="z-index: 1">
        <b-input-group>
          <b-form-input
            @change="addtag"
            v-model="currTag"
            placeholder="Zadaj kategorie ... "
          >
          </b-form-input>
        </b-input-group>
        <b-badge
          pill
          v-for="tag in searchTags"
          :key="tag"
          style="background: green"
          class="m-1"
        >
          <span
            class="d-flex flex-row justify-content-between align-items-center"
            >{{ tag }}
            <b-btn-close class="ml-2" @click="removeTag(tag)"></b-btn-close
          ></span>
        </b-badge>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  mounted() {},
  data() {
    return {
      searchStr: "",
      searchTags: ["test"],
      currTag: "",
      expanded: false,
    };
  },
  methods: {
    search() {
      this.$emit("search", this.searchStr);
    },
    addtag() {
      this.searchTags.push(this.currTag);
      this.currTag = "";
    },
    removeTag(tag: string) {
      this.searchTags.splice(
        this.searchTags.findIndex((e) => e == tag),
        1
      );
    },
  },
});
</script>

<style scoped>
.slide-leave-active,
.slide-enter-active {
  transition: 250ms ease-in-out;
}
.slide-enter {
  transform: translate(0, -100%);
}
.slide-leave-to {
  transform: translate(0, -100%);
}
</style>