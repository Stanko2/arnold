<template>
  <div class="right-bar bg-secondary position-relative">
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
          class="list-group-item"
          :showPDFPreview="showPreviews"
          :documentID="document.id"
          :showTimer="showTimer"
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
import SearchBar from "./SearchBar.vue";
import { Documents, getViewedDocument } from "@/DocumentManager";
import { Document } from "@/@types";
import { PDFdocument } from "./PDFdocument";
import { Database } from "@/Db";
import Editor from "@/views/Editor.vue";

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
  selectedIndex: number = -1;
  pdf!: PDFdocument;
  prefs: any;
  openTime: number = 0;
  timer!: NodeJS.Timer;
  mounted() {
    this.documentsShown = this.documents.map(() => true);
    this.$nextTick(() => this.init());
    this.$refs.searchBar.getTags();
    this.eventHub.$on("document:save", this.save);
    this.eventHub.$on("editor:search", this.search);
    this.timer = setInterval(this.stopwatchUpdate, 1000);
  }
  init() {
    this.eventHub.$on(
      "editor:documentChanged",
      (doc: PDFdocument, metadata: Document) => {
        this.selectedIndex = Documents.findIndex((e) => e.id === metadata.id);
        this.openTime = Date.now();
        this.pdf = doc;
        if (this.$refs.documentList) {
          this.UpdateCurrentPreview();
        }
      }
    );
    if (getViewedDocument() == null) {
      const idx = parseInt(this.$route.params.doc);
      this.updateSelected(idx, true);
      setTimeout(() => {
        this.eventHub.$emit("editor:setDocument", idx);
      }, 50);
    }
  }
  data() {
    const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    return {
      pdf: undefined,
      selectedIndex: 0,
      tags: tags,
      documentsShown: this.documents.map(() => true),
    };
  }
  async save() {
    this.$refs.documentList[this.selectedIndex].documentBusy = true;
    console.log('saving');
    const doc = await this.pdf.save();
    console.log('saved');
    // .catch((err) => {
    //   this.$bvToast.toast(err, {
    //     variant: "danger",
    //     title: "Save failed",
    //   });
    //   this.$refs.documentList[this.selectedIndex].documentBusy = false;
    // });
    this.$store.commit('updateDocument', doc);
    // this.UpdateCurrentPreview();
  }
  async selectDir(dir: number) {
    if (!(this.$parent as Editor).$refs.viewport.loaded) return;
    if (this.autoSave) await this.save();
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
      .push({ name: "Editor", params: { doc: newId.toString() } })
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
    // if (this.selectedIndex != newIndex) {
    //   this.documents[this.selectedIndex].timeOpened +=
    //     Date.now() - this.openTime;
    //   Database.updateDocument(
    //     this.documents[this.selectedIndex].id,
    //     this.documents[this.selectedIndex],
    //     false
    //   );
    // }
  }
  stopwatchUpdate() {
    if (this.$refs.documentList && this.selectedIndex != -1) {
      this.$refs.documentList[this.selectedIndex].updateStopwatch(
        this.openTime,
        this.documents[this.selectedIndex].timeOpened
      );
    }
  }
  async selectIndex(id: number) {
    if (!(this.$parent as Editor).$refs.viewport.loaded) return;
    if (this.autoSave) await this.save();
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