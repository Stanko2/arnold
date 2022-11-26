<template>
  <div id="app">
    <nav
      class="navbar navbar-light bg-primary"
      style="padding: 0"
    >
      <topbar
        ref="topbar"
        class="pdf"
      />
    </nav>
    <div class="d-flex main">
      <transition name="sidebar">
        <sidebar
          v-if="loadedDocuments"
          v-show="sidebarVisible"
          ref="sidebar"
          :auto-save="prefs && prefs.other.settings.autoSave"
          :show-previews="prefs && prefs.other.settings.showPreviews"
          :show-timer="prefs && prefs.other.settings.showTimer"
          :documents="Documents"
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
        <toolbar :pdf="pdf" />
        <div
          v-if="pdf != null"
          class="viewportWrapper"
        >
          <keep-alive :max="10">
            <Viewport
              :key="pdf.id"
              ref="viewport"
              :pdf="pdf"
            />
          </keep-alive>
        </div>
        <div
          v-else
          class="empty-text"
        >
          Nie je vybraté žiadne riešenie
        </div>
      </div>
    </div>
    <scoring />
    <tags />
    <shortcuts />
  </div>
</template>

<script lang="ts">
import {Vue} from "vue-property-decorator";
import {Document, Settings} from "@/@types";
import Viewport from "../components/Viewport.vue";
import Topbar from "../components/Topbar/Topbar.vue";
import Toolbar from "../components/Tools/Toolbar.vue";
import SearchBar from "../components/Filtering/SearchBar.vue";
import {Documents, getViewedDocument, loadFromDatabase, onEditorStart} from "../Documents/DocumentManager";
import type {PDFdocument} from "@/components/PDFdocument";
import Scoring from "@/components/Scoring/Scoring.vue";
import {loadFonts} from "@/components/Fonts";
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
    this.$store.commit("loadData");
    onEditorStart();
    if (Documents.length == 0) {
      loadFromDatabase(this.$store.state.currentProblem)
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
    Documents.sort((a: Document, b: Document) => a.index - b.index);
    this.Documents = Documents;
    this.documentsShown = Documents.map(() => true);
    this.pdf = getViewedDocument();
  }

  zoomKeyListener: undefined | ((e: KeyboardEvent) => void) = undefined;
  zoomScrollListener: undefined | ((e: WheelEvent) => void) = undefined;

  created() {
    this.zoomKeyListener = (event: KeyboardEvent) => {
      // disable zooming
      if (event.ctrlKey && (event.key == "+" || event.key == "-")) {
        event.preventDefault();
        event.stopPropagation();
        this.eventHub.$emit('viewport:scale', 0.1 * (event.key == "+" ? 1 : -1));
      }
    }
    this.zoomScrollListener = (event: WheelEvent) => {
      // disable zooming
      if (event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        this.eventHub.$emit('viewport:scale', 0.1 * (event.deltaY < 0 ? 1 : -1));
      }
    }
    window.addEventListener("keydown", this.zoomKeyListener);
    window.addEventListener("wheel", this.zoomScrollListener, { passive: false });
  }

  destroyed() {
    if (this.zoomKeyListener) window.removeEventListener("keydown", this.zoomKeyListener);
    if (this.zoomScrollListener) window.removeEventListener("wheel", this.zoomScrollListener);

    this.zoomKeyListener = undefined; this.zoomScrollListener = undefined;
  }
}
</script>

<style lang="scss" scoped>
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
  ul {
    overflow: auto;
    top: 0;
    bottom: 0;
  }
}
.pdf-tab {
  width: 100%;
}
.viewportWrapper {
  height: calc(100% - 60px);
}

.sidebar {
  &-leave-active, &-enter-active {
    transition: 250ms ease-in-out;
  }
  &-enter-to, &-leave {
    right: 0;
  }
  &-leave-to, &-enter {
    right: 25vw;
  }
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
  background-color: var(--primary);
  cursor: pointer;
  transition: all 250ms linear;
  transform-origin: center center;
  padding: 5px;
  box-shadow: 2px 5px 14px rgb(0 0 0 / 50%);

  &:hover {
    background: var(--primary);
    width: 50px;
  }

  &.visible{
    left: min(28.6vw, 485px);
    span {
      transform: rotate(180deg);
    }
    &:hover {
      width: 30px;
    }
  }

  span {
    transition: all 250ms linear;
  }
}
.right-bar {
  width: min(40vw, 600px);
  overflow: hidden;
}
.empty-text{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  height: calc(100% - 60px);
  font-weight: 900;
  color: var(--bg-500)
}
</style>
