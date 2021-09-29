<template>
  <div id="app">
    <nav class="navbar navbar-light bg-primary" style="padding: 0">
      <topbar class="pdf" @download="downloadCurrent" ref="topbar"></topbar>
    </nav>
    <div class="d-flex main">
      <transition name="sidebar">
        <sidebar
          v-if="loadedDocuments"
          v-show="sidebarVisible"
          :autoSave="prefs && prefs.autoSave"
          :showPreviews="prefs && prefs.showPreviews"
          :documents="Documents"
          ref="sidebar"
        />
      </transition>
      <div style="width: 100%">
        <toolbar :pdf="pdf" @refresh="refresh"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <keep-alive>
            <Viewport :pdf="pdf" :key="pdf.id" ref="viewport"></Viewport>
          </keep-alive>
        </div>
      </div>
    </div>
    <scoring />
    <tagy />
    <div
      v-shortkey.once="getShortcut('selectPrev')"
      @shortkey="$refs.sidebar.selectDir(-1)"
    ></div>
    <div
      v-shortkey.once="getShortcut('selectNext')"
      @shortkey="$refs.sidebar.selectDir(1)"
    ></div>
    <div
      v-shortkey.once="getShortcut('save')"
      @shortkey="$refs.sidebar.save()"
    ></div>
    <div
      v-shortkey.once="getShortcut('delete')"
      @shortkey="deleteSelected"
    ></div>
    <div v-shortkey.once="getShortcut('zoomIn')" @shortkey="scale(0.1)"></div>
    <div v-shortkey.once="getShortcut('zoomOut')" @shortkey="scale(-0.1)"></div>
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Document } from "@/@types";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import SearchBar from "../components/SearchBar.vue";
import DocumentPreview from "../components/DocumentPreview.vue";
import { Documents, loadFromDatabase } from "../DocumentManager";
import type { PDFdocument } from "@/components/PDFdocument";
import Scoring from "@/components/Scoring.vue";
import { loadFonts } from "@/components/Fonts";
import Tagy from "@/components/Tags/Tagy.vue";
import Component from "vue-class-component";
import Sidebar from "@/components/Sidebar.vue";

@Component({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    DocumentPreview,
    Scoring,
    SearchBar,
    Tagy,
    Sidebar,
  },
})
export default class Editor extends Vue {
  Documents!: Document[];
  documentsShown!: boolean[];
  selectedIndex: number = 0;
  pdf!: PDFdocument;
  shortcuts: any;
  prefs: any;
  loadedDocuments: boolean = false;
  sidebarVisible: boolean = true;

  $refs!: {
    searchBar: SearchBar;
    viewport: Viewport;
    sidebar: Sidebar;
  };
  mounted() {
    if (Documents.length == 0) {
      loadFromDatabase().then((Documents) => {
        this.Documents = Documents;
        this.loadedDocuments = true;
        this.$nextTick(() => init());
      });
    } else this.$nextTick(() => init());
    const init = () => {
      this.eventHub.$on("editor:documentChanged", (doc: PDFdocument) => {
        this.pdf = doc;
      });
      this.eventHub.$on("editor:sidebarToggle", () => {
        this.sidebarVisible = !this.sidebarVisible;
      });
      loadFonts();
    };
  }
  data() {
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    const prefs = JSON.parse(localStorage.getItem("preferences") || "{}")?.other
      ?.settings;
    const shortcuts = JSON.parse(localStorage.getItem("preferences") || "{}")
      ?.shortcut?.settings;
    return {
      pdf: undefined,
      Documents: Documents,
      selectedIndex: 0,
      documentsShown: Documents.map(() => true),
      tags: tags,
      prefs: prefs,
      shortcuts: shortcuts,
      loadedDocuments: false,
      sidebarVisible: true,
    };
  }
  getShortcut(name: string) {
    const defaultShortcuts: Record<string, string> = {
      selectNext: "ctrl+arrowdown",
      selectPrev: "ctrl+arrowup",
      save: "ctrl+s",
      delete: "del",
      zoomIn: "ctrl+plus",
      zoomOut: "ctrl+-",
    };
    let shortcut: string = defaultShortcuts[name];
    const savedShortcut = this.shortcuts?.find((e: any) => e.name == name);
    if (savedShortcut) {
      shortcut = savedShortcut.shortcut;
    }
    return shortcut.split("+").map((e) => (e === "plus" ? "+" : e));
  }
  downloadCurrent() {
    this.eventHub.$emit("editor:download", this.pdf.id);
  }
  deleteSelected() {
    const viewport = this.$refs.viewport;
    viewport.deleteSelected();
  }
  refresh() {
    this.$refs.viewport.$forceUpdate();
    this.$nextTick().then(() => {
      this.eventHub.$emit("editor:setDocument", this.selectedIndex);
    });
  }
  scale(multiplier: number) {
    this.$refs.viewport.setScale(multiplier);
  }
}
</script>

<style>
.navbar {
  height: 40px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
.main {
  height: calc(100vh - 40px);
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
  height: calc(100% - 50px);
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
  transform: translate(100%, 0);
  opacity: 0;
}

.sidebar-leave-active,
.sidebar-enter-active {
  transition: 250ms ease-in-out;
}

.sidebar-enter-to,
.sidebar-leave {
  right: 0;
}
.sidebar-leave-to,
.sidebar-enter {
  right: 25vw;
}

/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
 
/* Handle */
::-webkit-scrollbar-thumb {
  background: #888; 
  border-radius: 5px;
  transition: all 300ms linear;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
</style>
