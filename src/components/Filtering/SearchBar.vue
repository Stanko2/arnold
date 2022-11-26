<template>
  <div>
    <b-input-group style="z-index: 0; position: static;">
      <b-form-input
        v-model="searchStr"
        type="text"
        placeholder="Hľadať v riešeniach"
        style="z-index: 0; position: relative;"
        size="lg"
      />
      <b-input-group-append style="z-index: 0; position: relative">
        <b-button
          variant="success"
          size="md"
          @click="search"
        >
          <span class="material-icons">search</span>
        </b-button>
        <b-button
          id="expand"
          variant="primary"
          size="md"
          @click="expanded = !expanded"
        >
          <span class="material-icons">{{
            expanded ? "expand_less" : "expand_more"
          }}</span>
        </b-button>
        <b-tooltip
          target="expand"
          triggers="hover"
        >
          Dalšie možnosti hľadania
        </b-tooltip>
      </b-input-group-append>
    </b-input-group>
    <transition name="slide">
      <div
        v-if="expanded"
        class="search-menu"
      >
        <b-input-group>
          <b-form-input
            v-model="currQuery"
            placeholder="Filtrovacie kritéria ... "
            size="sm"
            @update="updateQuery(currQuery)"
          />
          <b-input-group-append>
            <b-button
              id="filter"
              v-b-modal.filterhelp
              variant="success"
              size="sm"
              class="material-icons"
            >
              help
            </b-button>
            <b-tooltip target="filter">
              Pomoc k filtrovaniu
            </b-tooltip>
            <filter-help />
          </b-input-group-append>
        </b-input-group>
        <h6 v-if="categories.length > 1">
          <b-badge
            v-for="(tag, i) in categories"
            :key="tag"
            class="m-1 category-toggle"
            size="lg"
            style=""
            :style="{
              opacity: categoriesVisible[i] ? 1 : 0.5,
            }"
            @click="toggleSearchCategory(tag)"
          >
            {{ tag }}
          </b-badge>
        </h6>
        <!-- <transition-group name="tags">
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
              ></b-btn-close
            ></span>
          </b-badge>
        </transition-group> -->
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import type { DocumentParser, Tag } from "@/@types";
import Color from "color";
import Vue from "vue";
import Component from "vue-class-component";
import filter from './Filter';
import FilterHelp from './FilterHelp.vue';

@Component({components: {FilterHelp}})
export default class SearchBar extends Vue {
  categories: string[] = [];
  categoriesVisible: boolean[] = [];
  tagValid: boolean | null = null;
  currQuery: string = "";
  availableTags: Tag[] = [];
  searchStr: string = "";
  expanded = false;

  mounted() {
    this.categories = JSON.parse(localStorage.getItem("categories") || "[]");
    this.categoriesVisible = this.categories.map(() => true);
    
    // @ts-ignore
    const filter: string = this.$route.query.filter ?? '';
    console.log(this.$route.query);
    
    setTimeout(() => {
      if(filter != ''){
        this.currQuery = filter
        this.updateQuery(filter)
      }
    }, 200);
  }

  search() {
    const onlyLettersRegex = /[a-z]+/gi;
    const query = this.searchStr.match(onlyLettersRegex)?.join("").toLowerCase() || "";
    
    this.eventHub.$emit(
      "editor:search",
      query,
      this.categories.filter((e: String, i: number) => {
        return this.categoriesVisible[i];
      })
    );
  }
  updateQuery(query: string) {
    try{
      filter.updateQuery(query)
      this.$router.replace({
        query: {
          filter: query
        }
      })
      this.search()
      this.tagValid = true
    }
    catch(e){
      this.tagValid = false;
      console.log(e);
      
    }
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
  z-index: 1;
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