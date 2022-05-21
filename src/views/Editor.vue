<template>
  <div id="app">
    <nav class="navbar navbar-light bg-primary" style="padding: 0">
      <topbar class="pdf" ref="topbar"></topbar>
    </nav>
    <div class="d-flex main">
      <transition name="sidebar">
        <sidebar
          v-if="loadedDocuments"
          v-show="sidebarVisible"
          :autoSave="prefs && prefs.other.settings.autoSave"
          :showPreviews="prefs && prefs.other.settings.showPreviews"
          :showTimer="prefs && prefs.other.settings.showTimer"
          :documents="Documents"
          ref="sidebar"
        />
      </transition>
      <div
        class="toggle-button"
        :class="{
          visible: sidebarVisible,
        }"
        @click="eventHub.$emit('editor:sidebarToggle')"
      >
        <span class="material-icons">arrow_forward_ios</span>
      </div>
      <div style="width: 100%">
        <toolbar :pdf="pdf"></toolbar>
        <div class="viewportWrapper" v-if="pdf != null">
          <keep-alive :max="10">
            <Viewport :pdf="pdf" :key="pdf.id" ref="viewport"></Viewport>
          </keep-alive>
        </div>
      </div>
    </div>
    <scoring />
    <tags />
    <shortcuts />
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Document, Settings, Shortcut } from "@/@types";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import SearchBar from "../components/SearchBar.vue";
import { Documents, getViewedDocument, loadFromDatabase } from "../DocumentManager";
import type { PDFdocument } from "@/components/PDFdocument";
import Scoring from "@/components/Scoring.vue";
import { loadFonts } from "@/components/Fonts";
import Tags from "@/components/Tags/Tagy.vue";
import Component from "vue-class-component";
import Sidebar from "@/components/Sidebar.vue";
import Shortcuts from "@/Mixins/Keybindings.vue"

@Component({
  components: {
    Viewport,
    Topbar,
    Toolbar,
    Scoring,
    Tags,
    Sidebar,
    Shortcuts
  },
})
export default class Editor extends Vue {
  Documents!: Document[];
  documentsShown!: boolean[];
  selectedIndex = 0;
  pdf: PDFdocument | null = null;
  get prefs(): Settings {
    return this.$store.state.settings;
  }
  loadedDocuments: boolean = false;
  sidebarVisible: boolean = true;

  $refs!: {
    searchBar: SearchBar;
    viewport: Viewport;
    sidebar: Sidebar;
  };
  mounted() {
    if (Documents.length == 0) {
      loadFromDatabase()
        .then((Documents) => {
          this.Documents = Documents;
          this.loadedDocuments = true;
          this.$nextTick(() => init());
        })
        .catch((e) => console.log(e));
    } else this.$nextTick(() => init());
    const init = () => {
      this.loadedDocuments = true;
      this.eventHub.$on("editor:documentChanged", (doc: PDFdocument) => {
        this.pdf = doc;
      });
      this.eventHub.$on("editor:sidebarToggle", () => {
        this.sidebarVisible = !this.sidebarVisible;
      });
      loadFonts();
    };
    this.$store.commit("loadData");
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    this.Documents = Documents;
    this.documentsShown = Documents.map(() => true);
    this.pdf = getViewedDocument();
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
  min-width: 300px;
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
  height: calc(100% - 60px);
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

.toggle-button.visible {
  left: max(20vw, 300px);
}
.toggle-button {
  position: fixed;
  z-index: 15;
  left: 0;
  bottom: 30px;
  height: 40px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: right;
  border-radius: 0 20px 20px 0;
  background-color: var(--success);
  cursor: pointer;
  transition: all 250ms linear;
  transform-origin: center center;
  padding: 5px;
  box-shadow: 2px 5px 14px rgb(0 0 0 / 50%);
}
.toggle-button:hover {
  background: #218838;
  width: 50px;
}
.toggle-button.visible:hover {
  width: 30px;
}

.toggle-button.visible span {
  transform: rotate(180deg);
}
.toggle-button span {
  transition: all 250ms linear;
}
</style>
