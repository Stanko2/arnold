<template>
  <div id="app">
    <nav class="navbar navbar-light bg-primary" style="padding: 0">
      <topbar
        @save="save"
        @select="selectDir"
        class="pdf"
        @download="downloadCurrent"
        ref="topbar"
      ></topbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary position-relative">
        <search-bar ref="searchBar" @search="search" />
        <ul ref="previews" class="list-group document-list">
          <transition
            v-for="(document, i) in Documents"
            :key="document.id"
            name="document-list"
          >
            <document-preview
              v-show="documentsShown[i]"
              ref="documentList"
              class="list-group-item"
              :documentID="document.id"
              :tags="tags"
              @click.native="selectIndex(document.index - 1)"
            ></document-preview>
          </transition>
          <li v-if="!documentsShown.some((e) => e)">
            <p class="text-danger">No matching documents</p>
          </li>
        </ul>
      </div>
      <div style="width: 100%">
        <toolbar :pdf="pdf" @refresh="refresh" @scale="scale"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <keep-alive>
            <Viewport :pdf="pdf" :key="selectedIndex" ref="viewport"></Viewport>
          </keep-alive>
        </div>
      </div>
    </div>
    <scoring @save="save" />
    <tagy @tagUpdate="updateTags" @documentTag="updateDocumentTags" />
    <div v-shortkey.once="['ctrl', 'arrowup']" @shortkey="selectDir(-1)"></div>
    <div v-shortkey.once="['ctrl', 'arrowdown']" @shortkey="selectDir(1)"></div>
    <div v-shortkey.once="['ctrl', 's']" @shortkey="save"></div>
    <div v-shortkey.once="['del']" @shortkey="deleteSelected"></div>
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import SearchBar from "../components/SearchBar.vue";
import DocumentPreview from "../components/DocumentPreview.vue";
import {
  getViewedDocument,
  eventHub as DocEventHub,
  // eslint-disable-next-line no-unused-vars
  Document,
  Documents,
  loadFromDatabase,
} from "../DocumentManager";
// eslint-disable-next-line no-unused-vars
import { PDFdocument } from "@/components/PDFdocument";
import Scoring from "@/components/Scoring.vue";
import { loadFonts } from "@/components/Fonts";
import Tagy from "@/components/Tagy.vue";

export default Vue.extend({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    DocumentPreview,
    Scoring,
    SearchBar,
    Tagy,
  },
  mounted() {
    if (Documents.length == 0) {
      loadFromDatabase().then(() => {
        this.$data.Documents = Documents;
        this.$data.documentsShown = Documents.map(() => true);
        this.$nextTick(() => init());
        (this.$refs.topbar as any).updateStats();
        (this.$refs.searchBar as any).getTags();
      });
    } else this.$nextTick(() => init());

    const init = () => {
      DocEventHub.$on(
        "documentChanged",
        (doc: PDFdocument, metadata: Document) => {
          this.$data.selectedIndex = metadata.index - 1;
          this.$data.pdf = doc;
          if (this.$refs.documentList) {
            this.UpdateCurrentPreview();
          }
        }
      );
      if (getViewedDocument() == null) {
        this.updateSelected(0, false);
        setTimeout(() => {
          DocEventHub.$emit("setDocument", 0);
        }, 50);
      }
      loadFonts();
    };
  },
  data() {
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    return {
      pdf: undefined,
      Documents: Documents,
      selectedIndex: 0,
      documentsShown: Documents.map(() => true),
      ukazBodovanie: false,
      tags: tags,
    };
  },
  methods: {
    save() {
      this.$data.pdf.save();
      this.UpdateCurrentPreview();
      (this.$refs.documentList as Vue[])[
        this.selectedIndex
      ].$data.documentBusy = true;
      (this.$refs.topbar as any).updateStats();
    },
    selectDir(dir: number) {
      const curr = Documents.findIndex((e) => e.id == this.$data.pdf.id);
      let i = curr + dir;
      while (this.$data.documentsShown[i] === false) {
        i += dir;
      }
      if (i < 0 || i >= Documents.length) return;
      this.updateSelected(i, true);
      DocEventHub.$emit("setDocument", i);
    },
    updateSelected(newIndex: number, scrolling: boolean) {
      const previews = this.$refs.documentList as Vue[];
      let height = 0;
      for (let i = 0; i < previews.length; i++) {
        const a = previews[i];
        if (i < newIndex) {
          height += a.$el.getBoundingClientRect().height;
        }
        a.$data.selected = i == newIndex;
      }
      if (scrolling)
        (this.$refs.previews as Element).scrollTo({
          top: height,
          left: 0,
          behavior: "smooth",
        });
    },
    selectIndex(index: number) {
      this.updateSelected(index, false);
      DocEventHub.$emit("setDocument", index);
    },
    search(query: string, tags: string[]) {
      const onlyLettersRegex = /[a-z]+/gi;
      query = query.match(onlyLettersRegex)?.join("").toLowerCase() || "";
      this.$data.Documents.forEach((e: Document, index: number) => {
        if (e.riesitel.toLowerCase().match(query) != null) {
          if (tags.length > 0) {
            this.documentsShown[index] = this.IsDocumentValid(tags, [
              ...e.tags,
              e.kategoria,
            ]);
          } else this.$data.documentsShown[index] = true;
        } else {
          this.$data.documentsShown[index] = false;
        }
      });
      this.$forceUpdate();
    },
    IsDocumentValid(searchTags: string[], documentTags: string[]): boolean {
      // neviem ako to presne spravit - ak je viac tagov, tak musia sediet vsetky, alebo staci ak sedi aspon jeden?
      return searchTags.some((e) => documentTags.includes(e));
    },
    UpdateCurrentPreview() {
      const documents = this.$refs.documentList as Vue[];
      if (documents.some((e: Vue) => e.$data.document == null)) return;
      const editing = documents.find(
        (e) => e.$data.document.id == this.$data.pdf.id
      ) as any;
      setTimeout(() => {
        if (editing) editing.updatePreview();
      }, 500);
    },
    downloadCurrent() {
      DocEventHub.$emit("download", this.$data.pdf.id);
    },
    deleteSelected() {
      const viewport = this.$refs.viewport as any;
      viewport.deleteSelected();
    },
    refresh() {
      (this.$refs.viewport as Vue).$forceUpdate();
      this.$nextTick().then(() => {
        DocEventHub.$emit("setDocument", this.selectedIndex);
      });
    },
    scale(multiplier: number) {
      (this.$refs.viewport as any).setScale(multiplier);
    },
    updateTags() {
      this.tags = JSON.parse(localStorage.getItem("tags") || "[]");
    },
    updateDocumentTags() {
      const curr = Documents.find((e) => e.id == this.$data.pdf.id);
      const preview = (this.$refs.documentList as Vue[])[
        (curr?.index || 0) - 1
      ];
      preview.$data.document.tags = curr?.tags || [];
    },
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
.main {
  height: 94vh;
  width: 100vw;
  overflow-x: hidden;
}
.pdf {
  width: 75vw;
}
.right-bar {
  width: 25vw;
  overflow: hidden;
}
.right-bar ul {
  overflow: auto;
  /* height: auto; */
  /* max-height: 100% !important; */
  top: 0;
  bottom: 0;
}
.pdf-tab {
  width: 100%;
}
.viewportWrapper {
  height: 93.5%;
}
.document-list {
  height: 100% !important;
}

.document-list-leave-active,
.document-list-enter-active {
  transition: 250ms ease-in-out;
}
.document-list-enter {
  transform: translate(0, -100%) scale(0.2);
  opacity: 0;
}
.document-list-leave-to {
  transform: translate(100%, 0) scale(0.5);
  opacity: 0;
}
</style>
