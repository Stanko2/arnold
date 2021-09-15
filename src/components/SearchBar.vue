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
        <h6>
          <b-badge
            v-for="(tag, i) in categories"
            :key="tag"
            class="m-1 category-toggle"
            @click="toggleSearchCategory(tag)"
            size="lg"
            style="background: var(--cyan)"
            :style="{
              opacity: categoriesVisible[i] ? 1 : 0.5,
            }"
          >
            {{ tag }}
          </b-badge>
        </h6>
        <transition-group name="tags">
          <b-badge
            pill
            v-for="tag in searchTags"
            :key="tag.meno"
            :style="{
              background: tag.color,
              color: getContrastColor(tag.color),
            }"
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
import { DocumentParser } from "@/DocumentParser";
import Color from "color";
import Vue from "vue";
export default Vue.extend({
  mounted() {
    this.getTags();
    this.eventHub.$on("tags:update", this.getTags);
    this.eventHub.$on("editor:loaded", (activeParser: DocumentParser) => {
      this.categories = activeParser.kategorie;
      this.categoriesVisible = activeParser.kategorie.map(() => true);
    });
  },
  data() {
    return {
      searchStr: "",
      availableTags: [],
      searchTags: [],
      currTag: "",
      expanded: false,
      tagValid: null,
      categoriesVisible: Array<Boolean>(),
      categories: Array<String>(),
    };
  },
  methods: {
    search() {
      this.eventHub.$emit(
        "editor:search",
        this.searchStr,
        this.searchTags.map((e: any) => e.id),
        this.categories.filter((e: String, i: number) => {
          return this.categoriesVisible[i];
        })
      );
    },
    addtag() {
      if (this.tagValid) {
        this.$data.searchTags.push(
          this.$data.availableTags.find((e: any) => e.meno == this.currTag)
        );
        this.currTag = "";
        this.tagValid = null;
        this.search();
      }
    },
    removeTag(tag: string) {
      this.searchTags.splice(
        this.searchTags.findIndex((e: any) => e.id == tag),
        1
      );
      this.search();
    },
    getTags() {
      const tags = JSON.parse(localStorage.getItem("tags") || "[]");
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
    getContrastColor(color: string) {
      const c = new Color(color);
      return c.isDark() ? "#ffffff" : "#000000";
    },
    toggleSearchCategory(category: string) {
      const i = this.categories.findIndex((e) => e == category);
      this.categoriesVisible[i] = !this.categoriesVisible[i];
      console.log(this.categoriesVisible);
      this.$forceUpdate();
      this.search();
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
.category-toggle {
  cursor: pointer;
  user-select: none;
  font-size: 0.7rem;
}
</style>