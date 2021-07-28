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
            :state="tagValid"
            @update="checkValidity(currTag)"
          >
          </b-form-input>
        </b-input-group>
        <transition-group name="tags">
          <b-badge
            pill
            v-for="tag in searchTags"
            :key="tag.meno"
            :style="{ background: tag.color }"
            class="m-1"
          >
            <span
              class="d-flex flex-row justify-content-between align-items-center"
              >{{ tag.meno }}
              <b-btn-close
                class="ml-2"
                @click="removeTag(tag.meno)"
              ></b-btn-close
            ></span>
          </b-badge>
        </transition-group>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { activeParser } from "@/DocumentManager";
import Vue from "vue";
export default Vue.extend({
  mounted() {
    this.getTags();
  },
  data() {
    return {
      searchStr: "",
      availableTags: [],
      searchTags: [],
      currTag: "",
      expanded: false,
      tagValid: null,
    };
  },
  methods: {
    search() {
      this.$emit(
        "search",
        this.searchStr,
        this.searchTags.map((e: any) => e.meno)
      );
    },
    addtag() {
      if (this.tagValid) {
        this.$data.searchTags.push(
          this.$data.availableTags.find((e: any) => e.meno == this.currTag)
        );
        this.currTag = "";
        this.tagValid = null;
      }
    },
    removeTag(tag: string) {
      this.searchTags.splice(
        this.searchTags.findIndex((e: any) => e.meno == tag),
        1
      );
    },
    getTags() {
      if (activeParser == undefined) return;
      const tags = JSON.parse(localStorage.getItem("tags") || "[]");
      for (const kategoria of activeParser.kategorie.map((e: string) => {
        return { meno: e, color: "#3D556E" };
      })) {
        tags.push(kategoria);
      }
      this.$data.availableTags = tags;
    },
    checkValidity(tag: string) {
      if (
        this.$data.availableTags.every((e: any) => e.meno.match(tag) == null) ||
        this.$data.searchTags.findIndex((e: any) => e.meno == tag) != -1
      )
        this.$data.tagValid = false;
      else if (
        this.$data.availableTags.findIndex((e: any) => e.meno == tag) != -1
      )
        this.$data.tagValid = true;
      else this.$data.tagValid = null;
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
.tags-leave-active {
  animation: bounce-in 500ms reverse;
}
.tags-enter-active {
  animation: bounce-in 500ms;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>