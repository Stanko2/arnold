<template>
  <div class="d-flex justify-content-between w-100">
    <div
      class="d-flex align-items-center justify-content-around stats-panel w-75"
    >
      <div class="stats">
        <h4>{{ stats.otvorene }} / {{ stats.celkovo }}</h4>
        <p>Pozretych</p>
      </div>
      <div class="stats">
        <h4>{{ stats.komentar }} / {{ stats.celkovo }}</h4>
        <p>Okomentovanych</p>
      </div>
      <div class="stats">
        <h4>{{ stats.obodovane }} / {{ stats.celkovo }}</h4>
        <p>Obodovanych</p>
      </div>
      <div class="stats">
        <h4>{{ stats.hotovo }} / {{ stats.celkovo }}</h4>
        <p>Hotovo</p>
      </div>
    </div>
    <div>
      <button class="btn btn-success" @click="save">Save</button>
      <b-button variant="success" :disabled="downloading" @click="downloadAll">
        <div v-if="downloading">
          <b-spinner
            variant="secondary"
            label="loading..."
            v-if="downloading"
            small
          ></b-spinner>
          Compressing
        </div>
        <div v-else>Download all</div>
      </b-button>
      <button class="btn btn-success" @click="download">Download</button>
    </div>
    <div class="bottom-progress-bar" v-if="downloading">
      <b-progress max="100" show-progress animated class="h-100 w-100">
        <b-progress-bar :value="progress" animated>
          <span>Progress: {{ progress.toFixed(2) }}% | File: {{ file }}</span>
        </b-progress-bar>
      </b-progress>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  // eslint-disable-next-line no-unused-vars
  Document,
  Documents,
  eventHub as DocEventHub,
} from "@/DocumentManager";

export default Vue.extend({
  mounted() {
    DocEventHub.$on("downloaded", () => (this.$data.downloading = false));
    DocEventHub.$on("zip-progress", (progress: number, file: string) => {
      this.$data.progress = progress;
      this.$data.file = file;
    });
    this.updateStats();
    setInterval(this.updateStats.bind(this), 1000);
  },
  data() {
    return {
      downloading: false,
      progress: 0,
      file: "",
      stats: {
        celkovo: 0,
        otvorene: 0,
        komentar: 0,
        obodovane: 0,
        hotovo: 0,
      },
    };
  },
  methods: {
    save() {
      this.$emit("save");
    },
    select(dir: number) {
      this.$emit("select", dir);
    },
    download() {
      this.$emit("download");
    },
    downloadAll() {
      DocEventHub.$emit("downloadZip");
      this.$data.downloading = true;
      this.$data.progress = 0;
      this.$data.file = "";
    },
    updateStats() {
      this.$data.stats = {
        celkovo: Documents.length,
        otvorene: this.count(Documents, (e: Document) => e.otvorene),
        komentar: this.count(Documents, (e: Document) => {
          return e.changes.some((f) => f.type === "Text");
        }),
        obodovane: 0,
        hotovo: 0,
      };
    },
    count(arr: any[], fn: (e: any) => boolean): number {
      let out = 0;
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        if (fn(el)) out++;
      }
      return out;
    },
  },
});
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
  transform-origin: bottom;
  height: 3vw;
  background: red;
}
.stats {
  user-select: none;
  display: inline;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  transition: all 300ms;
  width: 25%;
  align-items: center;
}
.stats h4 {
  transition: all 300ms;
  display: inline;
}
.stats p {
  transition: all 300ms;
  display: inline;
  margin-left: 1rem;
}
.stats-panel:hover .stats h4 {
  font-size: 3rem;
}
.stats-panel:hover .stats p {
  display: block;
}
</style>