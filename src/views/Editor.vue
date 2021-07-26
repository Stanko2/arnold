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
        <ul class="list-group document-list">
          <document-preview
            ref="documentList"
            class="list-group-item"
            v-for="(document, i) in Documents"
            v-show="documentsShown[i]"
            :key="document.id"
            :documentID="document.id"
            isSelected="true"
            :tags="tags"
            @click.native="selectIndex(document.index - 1)"
          ></document-preview>
          <li v-if="!documentsShown.some((e) => e)">
            <p class="text-danger">No matching documents</p>
          </li>
        </ul>
      </div>
      <div style="width: 100%">
        <toolbar :pdf="pdf" @refresh="refresh"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <keep-alive>
            <Viewport :pdf="pdf" :key="selectedIndex" ref="viewport"></Viewport>
          </keep-alive>
        </div>
      </div>
    </div>
    <bodovanie @save="save" />
    <tagy @tagUpdate="updateTags" />
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
import Bodovanie from "@/components/Bodovanie.vue";
import { loadFonts } from "@/components/Fonts";
import Tagy from "@/components/Tagy.vue";

export default Vue.extend({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    DocumentPreview,
    Bodovanie,
    SearchBar,
    Tagy,
  },
  mounted() {
    if (Documents.length == 0) {
      loadFromDatabase().then(() => {
        this.$data.Documents = Documents;
        this.$data.documentsShown = Documents.map(() => true);
        this.$nextTick(() => init(this));
        (this.$refs.topbar as any).updateStats();
        (this.$refs.searchBar as any).getTags();
      });
    } else this.$nextTick(() => init(this));

    function init(el: Vue) {
      DocEventHub.$on(
        "documentChanged",
        (doc: PDFdocument, metadata: Document) => {
          el.$data.selectedIndex = metadata.index;
          el.$data.pdf = doc;
          if (el.$refs.documentList) {
            (el as any).UpdateCurrentPreview();
          }
        }
      );
      if (getViewedDocument() == null) {
        setTimeout(() => {
          DocEventHub.$emit("setDocument", 0);
        }, 50);
      }
      loadFonts();
    }
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
      (this.$refs.topbar as any).updateStats();
    },
    selectDir(dir: number) {
      const curr = Documents.findIndex((e) => e.id == this.$data.pdf.id);
      let i = curr + dir;
      while (this.$data.documentsShown[i] === false) {
        i += dir;
      }
      DocEventHub.$emit("setDocument", i);
    },
    selectIndex(index: number) {
      DocEventHub.$emit("setDocument", index);
    },
    search(query: string, tags: string[]) {
      this.$data.Documents.forEach((e: Document, index: number) => {
        if (e.riesitel.match(query) != null) {
          if (tags.length > 0) {
            // neviem ako to presne spravit - ak je viac tagov, tak musia sediet vsetky, alebo staci ak sedi aspon jeden?
            e.tags.push(e.kategoria);
            this.documentsShown[index] = e.tags.every((f) => tags.includes(f));
            e.tags.splice(e.tags.length - 1, 1);
          } else this.$data.documentsShown[index] = true;
        } else {
          this.$data.documentsShown[index] = false;
        }
      });
      this.$forceUpdate();
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
    downloadAll() {},
    downloadCurrent() {
      DocEventHub.$emit("download", this.$data.pdf.id);
    },
    deleteSelected() {
      const viewport = this.$refs.viewport as any;
      viewport.deleteSelected();
    },
    refresh() {
      const viewport = this.$refs.viewport as any;
      viewport.refresh();
    },
    updateTags() {
      this.tags = JSON.parse(localStorage.getItem("tags") || "[]");
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
</style>
