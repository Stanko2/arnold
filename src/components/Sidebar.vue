<template>
  <div class="right-bar position-relative">
    <search-bar ref="searchBar" />
    <ul ref="previews" class="list-group document-list p-0">
      <transition
        v-for="(document, i) in documents"
        :key="document.id"
        name="document-list"
      >
        <document-preview
          v-show="documentsShown[i]"
          ref="documentList"
          :showPDFPreview="showPreviews"
          :documentID="document.id"
          :showTimer="showTimer"
          :index="i + 1"
          @click.native="selectIndex(document.id)"
        ></document-preview>
      </transition>
      <li v-if="!documentsShown.some((e) => e)">
        <p class="text-danger">Nenašli sa žiadne riešenia</p>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import DocumentPreview from "./DocumentPreview.vue";
import Component from "vue-class-component";
import SearchBar from "./Filtering/SearchBar.vue";
import { Documents, getViewedDocument } from "@/Documents/DocumentManager";
import { Document, Settings } from "@/@types";
import { PDFdocument } from "./PDFdocument";
import Editor from "@/views/Editor.vue";
import { Stopwatch } from "@/components/Stopwatch";

const SidebarProps = Vue.extend({
  props: {
    autoSave: {
      type: Boolean,
      default: true,
    },
    showPreviews: {
      type: Boolean,
      default: true,
    },
    showTimer: {
      type: Boolean,
      default: false,
    },
    documents: {
      type: Array as () => Document[],
      default: [],
    },
  },
});

@Component({
  components: {
    DocumentPreview,
    SearchBar,
  },
})
export default class Sidebar extends SidebarProps {
  $refs!: {
    searchBar: SearchBar;
    documentList: DocumentPreview[];
    previews: Element;
  };
  documentsShown!: boolean[];
  selectedIndex = 0;
  pdf!: PDFdocument;
  prefs!: Settings;
  timer!: NodeJS.Timer;
  stopwatch: Stopwatch = new Stopwatch();
  mounted() {
    this.documentsShown = this.documents.map(() => true);
    this.$nextTick(() => this.init());
    this.$refs.searchBar.getTags();
    this.eventHub.$on("document:save", this.save);
    this.eventHub.$on("editor:search", this.search);
    this.eventHub.$on("shortcut:selectNext", () => this.selectDir(1));
    this.eventHub.$on("shortcut:selectPrev", () => this.selectDir(-1));
    this.eventHub.$on("shortcut:save", this.save);
    this.timer = setInterval(this.stopwatchUpdate, 1000);
  }
  init() {
    this.eventHub.$on(
      "editor:documentChanged",
      (doc: PDFdocument, metadata: Document) => {
        this.selectedIndex = Documents.findIndex((e) => e.id === metadata.id);
        this.pdf = doc;
        if (this.$refs.documentList) {
          this.UpdateCurrentPreview();
        }
      }
    );
    const idx = parseInt(this.$route.params.doc);
    if (idx != -1) {
      this.updateSelected(idx, true);
      setTimeout(() => {
        this.eventHub.$emit("editor:setDocument", idx);
      }, 50);
    }
  }
  data() {
    const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    return {
      tags: tags,
      documentsShown: this.documents.map(() => true),
    };
  }
  async save() {
    if(getViewedDocument() == null) return;
    this.$refs.documentList[this.selectedIndex].documentBusy = true;

    const doc = await this.pdf.save()
      .catch((err) => {
        this.$bvToast.toast(err, {
          variant: "danger",
          title: "Save failed",
        });
        this.$refs.documentList[this.selectedIndex].documentBusy = false;
      });
    this.$store.commit('updateDocument', doc);
    // this.UpdateCurrentPreview();
  }
  async selectDir(dir: number) {
    if(!await this.beforeChange()) return;
    const curr = Documents.findIndex((e) => e.id == this.pdf.id);
    let i = curr + dir;
    while (this.documentsShown[i] === false) {
      i += dir;
    }
    if (i < 0 || i >= Documents.length) return;
    this.updateSelected(Documents[i].id, true);
    this.eventHub.$emit("editor:setDocument", Documents[i].id);
  }
  updateSelected(newId: number, scrolling: boolean) {
    const newIndex = Documents.findIndex((e) => e.id == newId);
    this.$router
      .replace({ name: "Editor", params: { doc: newId.toString() } })
      .catch(() => { });
    const previews = this.$refs.documentList;
    let height = 0;
    for (let i = 0; i < previews.length; i++) {
      const a = previews[i];
      if (i < newIndex) {
        height += a.$el.getBoundingClientRect().height;
      }
      a.selected = i == newIndex;
    }
    if (scrolling)
      this.$refs.previews.scrollTo({
        top: height,
        left: 0,
        behavior: "smooth",
      });
  }

  async beforeChange(){
    if(getViewedDocument() == null) return true;
    if (this.autoSave) await this.save();
    if (!(this.$parent as Editor).$refs.viewport.loaded) {
      return false;
    }
    return true;
  }

  stopwatchUpdate() {
    if (this.$refs.documentList && this.selectedIndex != -1) {
      this.$refs.documentList[this.selectedIndex]?.updateStopwatch(
        this.stopwatch.time
      );
    }
  }
  async selectIndex(id: number) {
    if(!await this.beforeChange()) return;
    this.updateSelected(id, false);
    this.eventHub.$emit("editor:setDocument", id);
  }
  search(query: string, tags: string[], categories: string[]) {
    const onlyLettersRegex = /[a-z]+/gi;
    let resultCount = 0;
    query = query.match(onlyLettersRegex)?.join("").toLowerCase() || "";
    this.documents.forEach((e: Document, index: number) => {
      if (
        e.riesitel.toLowerCase().match(query) != null &&
        categories.includes(e.kategoria)
      ) {
        if (tags.length > 0) {
          this.documentsShown[index] = this.IsDocumentValid(tags, e.tags);
        } else this.documentsShown[index] = true;
      } else {
        this.documentsShown[index] = false;
      }

      if (this.documentsShown[index]) resultCount++;
    });
    // this.$bvToast.toast(`Najdenych ${resultCount} rieseni`, {
    //   variant: "info",
    //   autoHideDelay: 1000,
    //   toaster: "b-toaster-bottom-left",
    //   appendToast: false,
    // });
    this.$forceUpdate();
  }
  IsDocumentValid(searchTags: string[], documentTags: string[]): boolean {
    return searchTags.every((e) => documentTags.includes(e));
  }
  UpdateCurrentPreview() {
    const documents = this.$refs.documentList;
    if (documents.some((e) => e.document == null)) return;
    const editing = documents.find((e) => e.document?.id == this.pdf.id);
    setTimeout(() => {
      if (editing) editing.updatePreview();
    }, 500);
  }
}
</script>

<style lang="scss" scoped>
.document-list {
  height: calc(100% - 50px);
  background-color: var(--bg-700);
  overflow: auto;
  &-leave-active, &-enter-active {
    transition: 250ms ease-in-out;
  }
  &-enter {
    transform: translate(0, -100%) scale(0.2);
    opacity: 0;
  }
  &-leave-to {
    transform: translate(100%, 0);
    opacity: 0;
  }
}
</style>