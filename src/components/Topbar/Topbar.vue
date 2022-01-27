<template>
  <div class="d-flex justify-content-between w-100">
    <div>
      <b-button variant="success" @click="$router.push({ path: '/' })"
        >Domov</b-button
      >
      <session-destroy-button :downloading="downloading" />
      <button class="btn btn-success" @click="eventHub.$emit('document:save')">
        Uložiť
      </button>
      <download-all-button />
      <!-- <b-button variant="success" :disabled="downloading" @click="downloadAll">
        <div v-if="downloading">
          <b-spinner
            variant="secondary"
            label="loading..."
            v-if="downloading"
            small
          ></b-spinner>
          Komprimujem
        </div>
        <div v-else>Download all</div>
      </b-button> -->
      <button class="btn btn-success" @click="download">Download</button>
      <add-document-button />
      <b-button variant="success" v-b-modal.stats>Štatistiky</b-button>
      <b-modal
        id="stats"
        title="Statistiky"
        centered
        size="xl"
        ok-only
        scrollable
        ><stats ref="stat"></stats
      ></b-modal>
      <b-button variant="success" v-b-modal.preferences>Nastavenia</b-button>
      <b-modal
        id="preferences"
        title="Nastavenia"
        size="xl"
        ok-only
        @ok="$refs.preferences.save()"
        ><preferences ref="preferences"></preferences
      ></b-modal>
      <b-button variant="success" @click="$router.push({ path: '/help' })"
        >Pomoc</b-button
      >
    </div>
    <div class="bottom-progress-bar" v-if="downloading">
      <b-progress max="100" show-progress animated class="h-100 w-100">
        <b-progress-bar :value="progress" animated>
          <span>{{ progress.toFixed(2) }}%</span>
        </b-progress-bar>
      </b-progress>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getViewedDocument } from "@/DocumentManager";
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
    this.eventHub.$on("download:done", () => (this.downloading = false));
    this.eventHub.$on("download:progress", (progress: number) => {
      this.progress = progress;
    });
    this.eventHub.$on("editor:downloadZip", () => { this.downloading = true; this.progress = 0 });
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
  width: 100vw;
  bottom: 0;
  height: 30px;
  z-index: 10;
}
</style>