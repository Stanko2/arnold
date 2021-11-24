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
    <div v-if="shortcutsUpdate">
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
      <div
        v-shortkey.once="getShortcut('zoomOut')"
        @shortkey="scale(-0.1)"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
import { Document, Settings, Shortcut } from "@/@types";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import SearchBar from "../components/SearchBar.vue";
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
    Scoring,
    Tagy,
    Sidebar,
  },
})
export default class Editor extends Vue {
  Documents!: Document[];
  documentsShown!: boolean[];
  selectedIndex: number = 0;
  pdf!: PDFdocument;
  shortcuts!: Shortcut[];
  prefs!: Settings;
  loadedDocuments: boolean = false;
  sidebarVisible: boolean = true;
  shortcutsUpdate: boolean = true;

  $refs!: {
    searchBar: SearchBar;
    viewport: Viewport;
    sidebar: Sidebar;
  };
  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type == "applySettings") {
        const settings = mutation.payload as Settings;
        this.prefs = settings;
        this.shortcuts = settings.shortcut.settings;
        this.shortcutsUpdate = false;
        this.$nextTick().then(() => {
          this.shortcutsUpdate = true;
        });
      }
    });
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
  }
  data() {
    this.$store.commit("loadData");
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    // const tags = JSON.parse(localStorage.getItem("tags") || "[]");
    // const prefs = JSON.parse(localStorage.getItem("preferences") || "{}")?.other
    //   ?.settings;
    // const shortcuts = JSON.parse(localStorage.getItem("preferences") || "{}")
    //   ?.shortcut?.settings;
    return {
      pdf: undefined,
      Documents: Documents,
      selectedIndex: 0,
      documentsShown: Documents.map(() => true),
      tags: this.$store.state.tags,
      prefs: this.$store.state.settings,
      shortcuts: this.$store.state.settings.shortcut.settings,
      loadedDocuments: false,
      sidebarVisible: true,
    };
  }
  getShortcut(name: string) {
    const shortcut = this.shortcuts?.find((e: any) => e.name == name);
    return shortcut?.shortcut.split("+").map((e) => (e === "plus" ? "+" : e));
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

.toggle-button.visible {
  left: 20vw;
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
