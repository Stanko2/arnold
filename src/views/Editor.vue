<template>
  <div id="app">
    <nav class="navbar sticky-top navbar-light bg-primary" style="padding: 0">
      <topbar
        @save="save"
        @select="selectDir"
        class="pdf"
        @download="downloadCurrent"
      ></topbar>
    </nav>
    <div class="d-flex main">
      <div class="right-bar bg-secondary position-relative">
        <div class="input-group position-sticky">
          <input
            type="text"
            class="form-control"
            placeholder="Search Documents ..."
            ref="searchInput"
            @input="search"
          />
          <div class="input-group-append">
            <button class="btn btn-success" @click="search">
              <span class="material-icons">search</span>
            </button>
          </div>
        </div>
        <ul class="list-group">
          <document-preview
            ref="documentList"
            class="list-group-item"
            v-for="(document, i) in Documents"
            v-show="documentsShown[i]"
            :key="document.id"
            :documentID="document.id"
            isSelected="true"
            @click.native="selectIndex(document.index - 1)"
          ></document-preview>
          <li v-if="!documentsShown.some((e) => e)">
            <p class="text-danger">No matching documents</p>
          </li>
        </ul>
      </div>
      <div style="width: 100%">
        <toolbar :pdf="pdf"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <!-- Keep alive viac menej funguje, az na to, ze z nejakych dovodov necashuje posledny navstiveny a ked failne nacitavanie sa to breakne - zacashuje sa broken dokument 
          treba cashnut az ked sa dokument uplne nacita -->
          <keep-alive include="pdf">
            <Viewport :pdf="pdf" :key="selectedIndex"></Viewport>
          </keep-alive>
        </div>
      </div>
    </div>
    <bodovanie @save="save" />
    <div v-shortkey.once="['ctrl', 'arrowup']" @shortkey="selectDir(-1)"></div>
    <div v-shortkey.once="['ctrl', 'arrowdown']" @shortkey="selectDir(1)"></div>
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import DocumentPreview from "../components/DocumentPreview.vue";
import {
  getViewedDocument,
  // metaDatas,
  eventHub as DocEventHub,
  // eslint-disable-next-line no-unused-vars
  Document,
  Documents,
} from "../DocumentManager";
// eslint-disable-next-line no-unused-vars
import { PDFdocument } from "@/components/PDFdocument";
import Bodovanie from "@/components/Bodovanie.vue";
import { loadFonts } from "@/components/Fonts";

export default Vue.extend({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    DocumentPreview,
    Bodovanie,
  },
  data() {
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    return {
      pdf: getViewedDocument(),
      Documents: Documents,
      selectedIndex: 0,
      documentsShown: Documents.map(() => true),
      ukazBodovanie: false,
    };
  },
  mounted() {
    if (getViewedDocument() == null) {
      setTimeout(() => {
        DocEventHub.$emit("setDocument", 0);
      }, 50);
    }
    loadFonts();
    DocEventHub.$on(
      "documentChanged",
      (pdf: PDFdocument, metadata: Document) => {
        this.$data.selectedIndex = metadata.index;
        this.$data.pdf = pdf;
        if (this.$refs.documentList) {
          (this as any).UpdateCurrentPreview();
          // (this.$refs.documentList as any[]).forEach((doc, i) => {
          //   doc.isSelected = this.$data.selectedIndex == i;
          // });
        }
      }
    );
  },
  methods: {
    save() {
      this.$data.pdf.save();
      this.UpdateCurrentPreview();
    },
    selectDir(dir: number) {
      DocEventHub.$emit("setDocument", this.$data.selectedIndex + dir);
    },
    selectIndex(index: number) {
      DocEventHub.$emit("setDocument", index);
    },
    search() {
      const query = (this.$refs.searchInput as any).value;
      console.log(query);
      this.$data.Documents.forEach((e: Document, index: number) => {
        if (e.riesitel.match(query) != null) {
          this.$data.documentsShown[index] = true;
        } else {
          this.$data.documentsShown[index] = false;
        }
      });
      this.$forceUpdate();
    },
    UpdateCurrentPreview() {
      const documents = this.$refs.documentList as Vue[];
      if (!documents.some((e: Vue) => e.$data.document.id != null)) return;
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
  overflow-x: hidden;
  overflow-y: scroll;
}
.pdf-tab {
  width: 100%;
}
.viewportWrapper {
  height: 93.5%;
}
</style>
