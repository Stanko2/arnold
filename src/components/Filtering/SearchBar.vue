<template>
  <div>
    <b-input-group style="z-index: 4">
      <b-form-input
        type="text"
        placeholder="Hľadať v riešeniach"
        v-model="searchStr"
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
          >Dalšie možnosti hľadania</b-tooltip
        >
      </b-input-group-append>
    </b-input-group>
    <transition name="slide">
      <div v-if="expanded" class="search-menu">
        <b-input-group>
          <b-form-input
            @change="addtag"
            v-model="currTag"
            placeholder="Filtrovacie kritéria ... "
            :state="tagValid"
            @update="checkValidity(currTag)"
            list="taglist"
          >
          </b-form-input>
          <datalist id="tagList">
            <option
              v-for="tag in availableTags"
              :key="tag.id"
              :value="tag.meno"
            >
              {{ tag.meno }}
            </option>
          </datalist>
        </b-input-group>
        <h6 v-if="categories.length > 1">
          <b-badge
            v-for="(tag, i) in categories"
            :key="tag"
            class="m-1 category-toggle"
            @click="toggleSearchCategory(tag)"
            size="lg"
            style=""
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
import type { DocumentParser, Tag } from "@/@types";
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";

@Component({})
export default class SearchBar extends Vue {
  categories: string[] = [];
  categoriesVisible: boolean[] = [];
  searchTags: Tag[] = [];
  tagValid: boolean | null = null;
  currTag: string = "";
  availableTags: Tag[] = [];
  searchStr: string = "";
  expanded = false;

  mounted() {
    this.getTags();
    this.eventHub.$on("tags:update", this.getTags);
    this.categories = JSON.parse(localStorage.getItem("categories") || "[]");
    this.categoriesVisible = this.categories.map(() => true);
  }

  search() {
    this.eventHub.$emit(
      "editor:search",
      this.searchStr,
      this.searchTags.map((e: Tag) => e.id),
      this.categories.filter((e: String, i: number) => {
        return this.categoriesVisible[i];
      })
    );
  }
  addtag() {
    const tag = this.availableTags.find((e: Tag) => e.meno == this.currTag);
    if (this.tagValid && tag) {
      this.searchTags.push(tag);
      this.currTag = "";
      this.tagValid = null;
      this.search();
    }
  }
  removeTag(tag: string) {
    this.searchTags.splice(
      this.searchTags.findIndex((e: any) => e.id == tag),
      1
    );
    this.search();
  }
  getTags() {
    // const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    this.availableTags = this.$store.state.tags;
  }
  checkValidity(tag: string) {
    if (
      this.availableTags.every((e: any) => e.meno.match(tag) == null) ||
      this.searchTags.findIndex((e: any) => e.meno == tag) != -1
    )
      this.tagValid = false;
    else if (this.availableTags.findIndex((e: any) => e.meno == tag) != -1)
      this.tagValid = true;
    else this.tagValid = null;
  }
  getContrastColor(color: string) {
    const c = new Color(color);
    return c.isDark() ? "#ffffff" : "#000000";
  }
  toggleSearchCategory(category: string) {
    const i = this.categories.findIndex((e) => e == category);
    this.categoriesVisible[i] = !this.categoriesVisible[i];
    console.log(this.categoriesVisible);
    this.$forceUpdate();
    this.search();
  }
}
</script>

<style scoped lang="scss">
.slide{
  &-leave-active, &-enter-active {
    transition: all 250ms ease-in-out;
  }
  &-enter{
    transform: translate(0, -100%);
    box-shadow: 0 0 0 transparent;
  }
  &-leave-to{
    transform: translate(0, -100%);
    box-shadow: 0 0 0 transparent;
  }
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
  background: var(--cyan);
  transition: opacity 250ms linear;
}
.search-menu {
  z-index: 3;
  position: absolute;
  left: 0;
  right: 0;
  background-color: var(--bg-700);
  padding: 5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.5);
}
</style>