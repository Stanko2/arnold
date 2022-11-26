<template>
  <!-- create navbar -->
  <b-navbar
    type="dark"
    variant="dark"
    style="width: 100%"
  >
    <b-navbar-brand
      :active="$route.path === '/'"
      @click="$router.push({ path: '/' })"
    >
      <img
        class="logo"
        src="@/assets/Icon.png"
        alt="Arnold"
        height="30"
      >
    </b-navbar-brand>
    <b-collapse
      id="nav-collapse"
      is-nav
    >
      <b-navbar-nav>
        <!-- session destroy button -->
        <session-destroy-button :disabled="downloading" />

        <b-nav-item class="nav-separator" />

        <!-- save button -->
        <b-nav-item @click="eventHub.$emit('document:save')">
          <span>Uložiť</span>
        </b-nav-item>

        <b-nav-item class="nav-separator" />

        <!-- download button -->

        <b-nav-item @click="download">
          <span>Stiahnuť</span>
        </b-nav-item>

        <!-- download all button -->
        <download-all-button :mode="1" />

        <b-nav-item class="nav-separator" />

        <!-- add document button -->

        <add-document-button />

        <b-nav-item class="nav-separator" />

        <!-- stats button -->
        <b-nav-item v-b-modal.stats>
          <span>Štatistiky</span>
          <b-modal
            id="stats"
            title="Štatistiky"
            centered
            size="xl"
            ok-only
            scrollable
          >
            <stats ref="stat" />
          </b-modal>
        </b-nav-item>

        <b-nav-item class="nav-separator" />

        <!-- preferences button -->
        <b-nav-item v-b-modal.preferences>
          <span>Nastavenia</span>
          <b-modal
            id="preferences"
            title="Nastavenia"
            size="xl"
            ok-only
            @ok="$refs.preferences.save()"
          >
            <preferences ref="preferences" />
          </b-modal>
        </b-nav-item>

        <b-nav-item class="nav-separator" />

        <!-- help button -->
        <b-nav-item @click="$router.push({ path: '/help' })">
          Pomoc
        </b-nav-item>
      </b-navbar-nav>
    </b-collapse>

    <div
      v-if="downloading"
      class="bottom-progress-bar"
    >
      <b-progress
        max="100"
        show-progress
        animated
        class="h-100 w-100"
      >
        <b-progress-bar
          :value="progress"
          animated
        >
          <span>{{ progress.toFixed(2) }}%</span>
        </b-progress-bar>
      </b-progress>
    </div>
  </b-navbar>
</template>

<script lang="ts">
import Vue from "vue";
import { getViewedDocument } from "@/Documents/DocumentManager";
import Stats from "../Stats/Stats.vue";
import Preferences from "../Preferences/Preferences.vue";
import Component from "vue-class-component";
import SessionDestroyButton from './SessionDestroyButton.vue';
import AddDocumentButton from "./AddDocumentsButton.vue";
import DownloadAllButton from "./DownloadAllButton.vue";

@Component({
  components: { Stats, Preferences, SessionDestroyButton, AddDocumentButton, DownloadAllButton },
})
export default class Topbar extends Vue {
  downloading: boolean = false;
  progress: number = 0;
  noveRiesenia: File[] = [];

  mounted() {
    this.eventHub.$on("download:done", () => { this.downloading = false });
    this.eventHub.$on("editor:downloadZip", () => { this.downloading = true; this.progress = 0 });
    this.eventHub.$on("download:progress", (progress: number) => {
      this.progress = progress;
    });
  }

  download() {
    this.eventHub.$emit("editor:download", getViewedDocument()?.id);
  }
}
</script>

<style>
.top-progress {
  margin: 0;
  width: 100%;
  height: 1.5vw;
}
.bottom-progress-bar {
  position: fixed;
  width: 100%;
  left: 0;
  bottom: 0;
  height: 30px;
  z-index: 10;
}

.nav-separator {
  border-right: 3px solid #505050;
  margin: 0;
  padding: 0;
  width: 0;
  height: 40px;
}

.logo {
  margin-right: 10px;
  transition: all 300ms ease-in-out;
}
.logo:hover {
  filter: blur(2px);
  transform: scale(1.1);
}
</style>