<template>
  <div class="d-flex justify-content-between w-100">
    <div style="width: 75%" class="d-flex align-items-center">
      <b-progress max="100" show-value class="top-progress">
        <b-progress-bar value="50" variant="success"></b-progress-bar>
        <b-progress-bar value="25" variant="info"></b-progress-bar>
        <b-progress-bar value="10" variant="danger"></b-progress-bar>
        <b-progress-bar value="10" variant="warning"></b-progress-bar>
      </b-progress>
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
import { eventHub as DocEventHub } from "@/DocumentManager";

export default Vue.extend({
  mounted() {
    DocEventHub.$on("downloaded", () => (this.$data.downloading = false));
    DocEventHub.$on("zip-progress", (progress: number, file: string) => {
      this.$data.progress = progress;
      this.$data.file = file;
    });
  },
  data() {
    var element = this;
    return {
      downloading: false,
      progress: 0,
      file: "",
      save() {
        element.$emit("save");
      },
      select(dir: number) {
        element.$emit("select", dir);
      },
      download() {
        element.$emit("download");
      },
      downloadAll() {
        DocEventHub.$emit("downloadZip");
        element.$data.downloading = true;
        element.$data.progress = 0;
        element.$data.file = "";
      },
    };
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
</style>